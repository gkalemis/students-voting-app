import { Router } from 'express';
import crypto from 'crypto';
import { db, getDefaultCriteria } from '../db';
import { authMiddleware } from '../middleware';
import { broadcastSession } from '../ws';
import { User, PresentationSession } from '../types';
import { scheduleAutoClose } from '../timerService';

export const demoSessionRouter = Router();

// Quick Demo Session Trigger (for Administrator demo mode testing)
demoSessionRouter.post('/admin/demo-session', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  if (user.role !== 'ADMIN') return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });

  // 1. Check if an active session already exists
  let active = db.sessions.find(s => s.status === 'ACTIVE' && s.is_demo && s.owner_id === user.id);
  if (active) {
    let p = db.presentations.find(x => x.session_id === active!.id && x.status === 'VOTING_OPEN');
    if (!p) {
      p = db.presentations.find(x => x.session_id === active!.id);
      if (p) p.status = 'VOTING_OPEN';
    }
    return res.json({ ok: true, session: active });
  }

  // 2. Check if there is a waiting or draft session to activate
  const waiting = db.sessions.find(s => s.is_demo && s.owner_id === user.id && (s.status === 'WAITING' || s.status === 'DRAFT'));
  if (waiting) {
    waiting.status = 'ACTIVE';
    let p = db.presentations.find(x => x.session_id === waiting.id);
    if (p) p.status = 'VOTING_OPEN';
    broadcastSession(waiting.public_id, 'state_changed');
    return res.json({ ok: true, session: waiting });
  }

  // 3. Otherwise create a complete demo session with sample presentation ready for voting
  let period = db.periods.find(p => p.owner_id === user.id && p.name === '2025-2026 (Demo)');
  if (!period) {
    period = { id: db.nextPeriodId++, name: '2025-2026 (Demo)', owner_id: user.id };
    db.periods.push(period);
  }
  let course = db.courses.find(c => c.owner_id === user.id && c.period_id === period!.id && c.name === 'Επιστημονικές Παρουσιάσεις (Demo)');
  if (!course) {
    course = {
      id: db.nextCourseId++,
      name: 'Επιστημονικές Παρουσιάσεις (Demo)',
      description: 'Μάθημα επίδειξης ψηφοφορίας',
      period_id: period.id,
      owner_id: user.id
    };
    db.courses.push(course);
  }
  const publicId = crypto.randomBytes(8).toString('base64url');
  const demoSession: PresentationSession = {
    id: db.nextSessionId++,
    public_id: publicId,
    course_id: course.id,
    period_id: period.id,
    group_id: 0,
    group_title: 'Ομάδα Demo (Επίδειξη)',
    owner_id: user.id,
    session_date: new Date().toISOString().slice(0, 10),
    title: 'Συνεδρία Επίδειξης (Demo Session)',
    status: 'ACTIVE',
    lock_new_participants: false,
    criteria_locked: false,
    voting_duration: 90,
    is_demo: true,
    results_revealed: false
  };
  db.sessions.push(demoSession);

  const criteria = getDefaultCriteria(demoSession.id);
  criteria.forEach(c => db.criteria.push(c));

  db.presentations.push({
    id: db.nextPresentationId++,
    session_id: demoSession.id,
    student_id: null,
    presenter_name: 'Αλέξανδρος Παπαδόπουλος',
    title: 'Ανάπτυξη Εφαρμογών & Τεχνητή Νοημοσύνη στην Εκπαίδευση',
    position: 0,
    status: 'VOTING_OPEN',
    criteria: criteria.map(c => ({ ...c }))
  });

  db.presentations.push({
    id: db.nextPresentationId++,
    session_id: demoSession.id,
    student_id: null,
    presenter_name: 'Ελένη Γεωργίου',
    title: 'Βιώσιμες Τεχνολογίες & Ανανεώσιμες Πηγές Ενέργειας',
    position: 1,
    status: 'PENDING',
    criteria: criteria.map(c => ({ ...c }))
  });

  broadcastSession(demoSession.public_id, 'state_changed');
  const presentation = db.presentations.find(p => p.session_id === demoSession.id && p.status === 'VOTING_OPEN')!;
  presentation.voting_opened_at = new Date().toISOString();
  presentation.voting_closes_at = new Date(Date.now() + 90_000).toISOString();
  scheduleAutoClose(demoSession.id, presentation.id, presentation.voting_closes_at);
  res.json({ ok: true, session: demoSession });
});
