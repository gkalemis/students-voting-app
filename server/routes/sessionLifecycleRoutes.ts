import { Router } from 'express';
import { db, calculateResults, finalizeVotes, getVoteCount } from '../db';
import { authMiddleware } from '../middleware';
import { broadcastSession } from '../ws';
import { User } from '../types';
import { clearPresentationTimer } from '../timerService';

export const sessionLifecycleRouter = Router();

export function deleteSessionEverywhere(sessionId: number) {
  const sessionPres = db.presentations.filter(p => p.session_id === sessionId);
  sessionPres.forEach(p => clearPresentationTimer(p.id));
  const presIds = sessionPres.map(p => p.id);
  if (presIds.length > 0) {
    db.votes = db.votes.filter(v => !presIds.includes(v.presentation_id));
    db.anonymousVoteScores = db.anonymousVoteScores.filter(v => !presIds.includes(v.presentation_id));
  }
  db.presentations = db.presentations.filter(p => p.session_id !== sessionId);
  db.criteria = db.criteria.filter(c => c.session_id !== sessionId);
  db.tokens = db.tokens.filter(t => t.session_id !== sessionId);
  db.sessions = db.sessions.filter(s => s.id !== sessionId);
}

// Session Actions: Activate
sessionLifecycleRouter.post('/sessions/:sid/activate', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }
  if (!['WAITING', 'DRAFT'].includes(s.status)) {
    return res.status(400).json({ detail: 'Η συνεδρία δεν μπορεί να ενεργοποιηθεί σε αυτή την κατάσταση' });
  }

  // Enforce single-active unarchived session per professor
  const targetOwnerId = s.owner_id;
  const openSession = db.sessions.find(
    other => other.owner_id === targetOwnerId &&
             other.id !== sid &&
             (other.status === 'ACTIVE' || other.status === 'COMPLETED')
  );

  if (openSession) {
    const course = db.courses.find(c => c.id === openSession.course_id);
    const group = db.groups.find(g => g.id === openSession.group_id);
    return res.status(409).json({
      error: 'SESSION_CONCURRENCY_LOCK',
      detail: 'Υπάρχει ήδη ανοιχτή ή μη αρχειοθετημένη συνεδρία. Πρέπει πρώτα να αρχειοθετηθεί πριν ενεργοποιηθεί νέα.',
      open_session_id: openSession.id,
      open_session_title: openSession.title || `${course?.name ? course.name + ' · ' : ''}${group?.title ? group.title + ' · ' : ''}${openSession.session_date}`,
      open_session_status: openSession.status
    });
  }

  s.status = 'ACTIVE';
  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});

// Session Actions: Complete
sessionLifecycleRouter.post('/sessions/:sid/complete', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }
  if (s.status !== 'ACTIVE') return res.status(400).json({ detail: 'Η συνεδρία δεν είναι ενεργή' });

  const activeP = db.presentations.find(p => p.session_id === sid && p.status === 'VOTING_OPEN');
  if (activeP) {
    activeP.status = getVoteCount(activeP.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
    activeP.voting_closed_at = new Date().toISOString();
  }

  db.presentations
    .filter(p => p.session_id === sid && p.status === 'PENDING')
    .forEach(p => { p.status = 'SKIPPED'; });

  finalizeVotes(sid);
  s.status = 'COMPLETED';
  s.completed_at = new Date().toISOString();
  s.results_revealed = true; // Auto-reveal results when completed

  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});

// Session Actions: Reveal
sessionLifecycleRouter.post('/sessions/:sid/reveal', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }
  if (!['COMPLETED', 'ARCHIVED'].includes(s.status)) {
    return res.status(400).json({ detail: 'Τα αποτελέσματα δεν είναι ακόμη διαθέσιμα' });
  }
  s.results_revealed = true;
  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});

// Session Actions: Archive
sessionLifecycleRouter.post('/sessions/:sid/archive', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }
  if (s.status !== 'COMPLETED') return res.status(400).json({ detail: 'Μόνο ολοκληρωμένες συνεδρίες αρχειοθετούνται' });

  const group = db.groups.find(g => g.id === s.group_id);
  const course = db.courses.find(c => c.id === s.course_id);
  const period = db.periods.find(p => p.id === s.period_id);
  const results = calculateResults(sid);

  s.archive_snapshot = {
    group_title: s.group_title || group?.title || s.archive_snapshot?.group_title || 'Ομάδα',
    course_name: course?.name || s.archive_snapshot?.course_name || '',
    period_name: period?.name || s.archive_snapshot?.period_name || '',
    session_date: s.session_date,
    results,
    archived_at: new Date().toISOString()
  };

  s.status = 'ARCHIVED';

  // Retire group from active groups list and student roster
  if (s.group_id) {
    const targetGid = s.group_id;
    db.groups = db.groups.filter(g => g.id !== targetGid);
    db.students = db.students.filter(st => st.group_id !== targetGid);
  }

  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true, archive_snapshot: s.archive_snapshot });
});

// Session Actions: Delete
sessionLifecycleRouter.delete('/sessions/:sid', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα διαγραφής αυτής της συνεδρίας' });
  }
  deleteSessionEverywhere(sid);
  res.status(204).send();
});
