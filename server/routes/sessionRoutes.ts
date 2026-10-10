import { Router } from 'express';
import crypto from 'crypto';
import { db, getVoteCount, calculateResults, finalizeVotes, effectiveBranding, getDefaultCriteria } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware';
import { broadcastSession } from '../ws';
import { User, PresentationSession } from '../types';

export const sessionRouter = Router();

// Sessions List & Create
sessionRouter.get('/sessions', authMiddleware, (req, res) => {
  db.sessions.forEach(s => cleanupGhostPresentations(s.id));
  res.json(db.sessions.map(s => ({
    id: s.id,
    public_id: s.public_id,
    title: s.title,
    session_date: s.session_date,
    status: s.status,
    is_demo: s.is_demo,
    course_id: s.course_id,
    group_id: s.group_id
  })));
});

sessionRouter.post('/sessions', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { course_id, period_id, group_id, session_date, title, criteria } = req.body;
  const publicId = crypto.randomBytes(8).toString('base64url');

  const s: PresentationSession = {
    id: db.nextSessionId++,
    public_id: publicId,
    course_id: Number(course_id),
    period_id: Number(period_id),
    group_id: Number(group_id),
    owner_id: user.id,
    session_date: session_date || new Date().toISOString().slice(0, 10),
    title: title || null,
    status: 'DRAFT',
    lock_new_participants: false,
    criteria_locked: false,
    voting_duration: 60,
    is_demo: false,
    results_revealed: false
  };
  db.sessions.push(s);

  const sessionCriteria = Array.isArray(criteria) && criteria.length > 0
    ? criteria.map((c: any, i: number) => ({
        id: db.nextCriterionId++,
        session_id: s.id,
        name: c.name || `Κατηγορία ${i + 1}`,
        weight: Number(c.weight) || 33,
        position: i
      }))
    : getDefaultCriteria(s.id);

  sessionCriteria.forEach(c => db.criteria.push(c));

  const groupStudents = db.students.filter(st => st.group_id === Number(group_id));
  groupStudents.forEach((st, i) => {
    db.presentations.push({
      id: db.nextPresentationId++,
      session_id: s.id,
      student_id: st.id,
      presenter_name: st.full_name,
      title: st.presentation_title,
      position: i,
      status: 'PENDING',
      criteria: sessionCriteria.map(sc => ({ ...sc }))
    });
  });

  res.status(201).json({ id: s.id, public_id: s.public_id });
});

export function cleanupGhostPresentations(sessionId: number) {
  const session = db.sessions.find(s => s.id === sessionId);
  const presentations = db.presentations.filter(p => p.session_id === sessionId);
  
  const ghostPres = presentations.filter(p => {
    if (p.student_id != null && !db.students.some(st => st.id === p.student_id)) {
      return true;
    }
    const presenterName = (p.presenter_name || '').trim().toLowerCase();
    if (!presenterName) return true;

    if (session && session.group_id) {
      const groupStudents = db.students.filter(st => st.group_id === session.group_id);
      const matchesGroup = groupStudents.some(st => st.full_name.trim().toLowerCase() === presenterName);
      if (!matchesGroup) return true;
    } else {
      const matchesAny = db.students.some(st => st.full_name.trim().toLowerCase() === presenterName);
      if (!matchesAny) return true;
    }

    return false;
  });

  if (ghostPres.length > 0) {
    const ghostIds = ghostPres.map(p => p.id);
    db.votes = db.votes.filter(v => !ghostIds.includes(v.presentation_id));
    db.anonymousVoteScores = db.anonymousVoteScores.filter(v => !ghostIds.includes(v.presentation_id));
    db.presentations = db.presentations.filter(p => !ghostIds.includes(p.id));
    const remaining = db.presentations
      .filter(p => p.session_id === sessionId)
      .sort((a, b) => a.position - b.position);
    remaining.forEach((p, idx) => {
      p.position = idx;
    });
  }
}

// Session Detail
sessionRouter.get('/sessions/:sid', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  cleanupGhostPresentations(sid);
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  const activeP = db.presentations.find(p => p.session_id === sid && p.status === 'VOTING_OPEN');
  if (activeP && activeP.voting_closes_at && new Date(activeP.voting_closes_at).getTime() < Date.now()) {
    activeP.status = getVoteCount(activeP.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
    activeP.voting_closed_at = new Date().toISOString();
    broadcastSession(s.public_id, 'state_changed');
  }

  const presentations = db.presentations
    .filter(p => p.session_id === sid)
    .sort((a, b) => a.position - b.position)
    .map(p => ({
      id: p.id,
      presenter_name: p.presenter_name,
      title: p.title,
      status: p.status,
      vote_count: getVoteCount(p.id, s.status === 'COMPLETED')
    }));

  const criteria = db.criteria
    .filter(c => c.session_id === sid)
    .sort((a, b) => a.position - b.position)
    .map(c => ({ id: c.id, name: c.name, weight: c.weight }));

  const course = db.courses.find(c => c.id === s.course_id);
  const period = db.periods.find(p => p.id === s.period_id);
  const group = db.groups.find(g => g.id === s.group_id);

  res.json({
    id: s.id,
    public_id: s.public_id,
    title: s.title,
    status: s.status,
    session_date: s.session_date,
    course_name: course?.name || '',
    period_name: period?.name || '',
    group_title: group?.title || '',
    branding: effectiveBranding(course),
    lock_new_participants: s.lock_new_participants,
    is_demo: s.is_demo,
    results_revealed: s.results_revealed,
    presentations,
    criteria,
    results: s.status === 'COMPLETED' ? calculateResults(sid) : null,
    participation_url: `/join/${s.public_id}`
  });
});

// Session Actions
sessionRouter.post('/sessions/:sid/activate', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  s.status = 'ACTIVE';
  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});

sessionRouter.post('/sessions/:sid/complete', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

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

  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});

sessionRouter.post('/sessions/:sid/reveal', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  s.results_revealed = true;
  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});

sessionRouter.post('/sessions/:sid/archive', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  s.status = 'ARCHIVED';
  res.json({ ok: true });
});

sessionRouter.delete('/sessions/:sid', adminMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  db.sessions = db.sessions.filter(s => s.id !== sid);
  db.presentations = db.presentations.filter(p => p.session_id !== sid);
  db.criteria = db.criteria.filter(c => c.session_id !== sid);
  res.status(204).send();
});
