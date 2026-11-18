import { Router } from 'express';
import crypto from 'crypto';
import { db, getVoteCount, calculateResults, effectiveBranding, getDefaultCriteria } from '../db';
import { authMiddleware } from '../middleware';
import { parsePositiveInt } from '../security';
import { broadcastSession } from '../ws';
import { User, PresentationSession } from '../types';
import { deleteSessionEverywhere, sessionLifecycleRouter } from './sessionLifecycleRoutes';
import { config } from '../config';
import { validSessionDate } from '../dates';
import { demoSessionRouter } from './demoSessionRoutes';
import { canOwn } from '../sessionAccess';
export function cleanupGhostPresentations(_sessionId: number) {}
export { deleteSessionEverywhere };
export const sessionRouter = Router();
sessionRouter.use(sessionLifecycleRouter);
sessionRouter.use(demoSessionRouter);
sessionRouter.get('/sessions', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.sessions : db.sessions.filter(s => s.owner_id === user.id);
  res.json(list.map(s => {
    const course = db.courses.find(c => c.id === s.course_id);
    const group = db.groups.find(g => g.id === s.group_id);
    return {
      id: s.id,
      public_id: s.public_id,
      title: s.title,
      session_date: s.session_date,
      status: s.status,
      is_demo: s.is_demo,
      course_id: s.course_id,
      course_name: course?.name || s.archive_snapshot?.course_name || '',
      group_id: s.group_id,
      group_title: s.group_title || group?.title || s.archive_snapshot?.group_title || '',
      owner_id: s.owner_id,
      archive_snapshot: s.archive_snapshot
    };
  }));
});

sessionRouter.post('/sessions', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { course_id, period_id, group_id, session_date, title, criteria } = req.body || {};

  const cid = parsePositiveInt(course_id);
  const pid = parsePositiveInt(period_id);
  const gid = parsePositiveInt(group_id);
  if (!cid || !pid || !gid) {
    return res.status(400).json({ detail: 'Απαιτούνται έγκυρο μάθημα, περίοδος και ομάδα' });
  }

  const course = db.courses.find(c => c.id === cid);
  const period = db.periods.find(p => p.id === pid);
  const targetGroup = db.groups.find(g => g.id === gid);
  if (!course || !period || !targetGroup) {
    return res.status(404).json({ detail: 'Το μάθημα, η περίοδος ή η ομάδα δεν βρέθηκε' });
  }
  if (!canOwn(user, course.owner_id) || !canOwn(user, period.owner_id) || !canOwn(user, targetGroup.owner_id)) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα χρήσης αυτών των πόρων' });
  }

  const publicId = crypto.randomBytes(8).toString('base64url');
  const groupTitle = targetGroup.title;
  const cleanTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 200) : groupTitle;
  if (!validSessionDate(session_date)) return res.status(422).json({ detail: 'Μη έγκυρη ημερομηνία συνεδρίας' });
  if (targetGroup.course_id !== cid || targetGroup.period_id !== pid || course.period_id !== pid) return res.status(400).json({ detail: 'Μη έγκυρη ακαδημαϊκή δομή' });
  const cleanDate = session_date;

  const s: PresentationSession = {
    id: db.nextSessionId++,
    public_id: publicId,
    course_id: cid,
    period_id: pid,
    group_id: gid,
    group_title: groupTitle,
    owner_id: user.id,
    session_date: cleanDate,
    title: cleanTitle,
    status: 'WAITING',
    lock_new_participants: false,
    criteria_locked: false,
    voting_duration: 60,
    is_demo: false,
    results_revealed: false
  };
  db.sessions.push(s);

  const sessionCriteria = Array.isArray(criteria) && criteria.length > 0
    ? criteria.slice(0, 20).map((c: any, i: number) => ({
        id: db.nextCriterionId++,
        session_id: s.id,
        name: String(c?.name || `Κατηγορία ${i + 1}`).trim().slice(0, 120),
        weight: Math.min(100, Math.max(0, Number(c?.weight) || 33)),
        position: i
      }))
    : getDefaultCriteria(s.id);

  sessionCriteria.forEach(c => db.criteria.push(c));

  const groupStudents = db.students.filter(st => st.group_id === gid);
  groupStudents.forEach((st, i) => {
    db.presentations.push({
      id: db.nextPresentationId++,
      session_id: s.id,
      student_id: null,
      presenter_name: st.full_name,
      title: st.presentation_title,
      position: i,
      status: 'PENDING',
      criteria: sessionCriteria.map(sc => ({ ...sc }))
    });
  });

  db.groups = db.groups.filter(g => g.id !== gid);
  db.students = db.students.filter(st => st.group_id !== gid);

  res.status(201).json({ id: s.id, public_id: s.public_id, status: s.status, group_title: s.group_title });
});

sessionRouter.put('/sessions/:sid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const sid = Number(req.params.sid);
  const session = db.sessions.find(s => s.id === sid);
  if (!session) return res.status(404).json({ detail: 'Η συνεδρία δεν βρέθηκε' });
  if (!canOwn(user, session.owner_id)) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα επεξεργασίας' });
  }
  if (session.status === 'ARCHIVED') {
    return res.status(400).json({ detail: 'Δεν είναι δυνατή η επεξεργασία αρχειοθετημένης συνεδρίας' });
  }

  const { title, session_date, presentations } = req.body;
  if (session_date !== undefined && !validSessionDate(session_date)) {
    return res.status(422).json({ detail: 'Μη έγκυρη ημερομηνία συνεδρίας' });
  }
  if (title !== undefined) session.title = title ? String(title).trim() : null;
  if (session_date !== undefined) session.session_date = String(session_date);

  if (Array.isArray(presentations)) {
    const sessionCriteria = db.criteria.filter(c => c.session_id === sid);
    const existingPres = db.presentations.filter(p => p.session_id === sid);
    const requestedIds = new Set(presentations.map((p: any) => Number(p.id)).filter(Number.isFinite));
    const protectedRemoval = existingPres.find(p => !requestedIds.has(p.id) && p.status !== 'PENDING');
    if (protectedRemoval) {
      return res.status(400).json({ detail: 'Δεν είναι δυνατή η διαγραφή παρουσίασης που έχει ήδη διεξαχθεί ή ψηφιστεί' });
    }
    const updatedIds: number[] = [];

    presentations.slice(0, 200).forEach((pData: any, idx: number) => {
      const presenterName = typeof pData?.presenter_name === 'string' ? pData.presenter_name.trim().slice(0, 150) : '';
      if (!presenterName) return;

      const topicTitle = typeof pData?.title === 'string' ? pData.title.trim().slice(0, 300) : '';
      const existingId = parsePositiveInt(pData?.id);
      const found = existingId ? existingPres.find(p => p.id === existingId) : undefined;

      if (found) {
        found.presenter_name = presenterName;
        found.title = topicTitle || null;
        found.position = idx;
        updatedIds.push(found.id);
      } else {
        const newPres = {
          id: db.nextPresentationId++,
          session_id: sid!,
          student_id: null,
          presenter_name: presenterName,
          title: topicTitle || null,
          position: idx,
          status: 'PENDING' as const,
          criteria: sessionCriteria.map(sc => ({ ...sc }))
        };
        db.presentations.push(newPres);
        updatedIds.push(newPres.id);
      }
    });

    const removedPres = existingPres.filter(p => !updatedIds.includes(p.id));
    if (removedPres.length > 0) {
      const removedIds = removedPres.map(p => p.id);
      db.votes = db.votes.filter(v => !removedIds.includes(v.presentation_id));
      db.anonymousVoteScores = db.anonymousVoteScores.filter(v => !removedIds.includes(v.presentation_id));
      db.presentations = db.presentations.filter(p => !removedIds.includes(p.id));
    }
  }

  broadcastSession(session.public_id, 'state_changed');
  const updatedPres = db.presentations.filter(p => p.session_id === sid).sort((a, b) => a.position - b.position);

  res.json({
    id: session.id,
    public_id: session.public_id,
    title: session.title,
    session_date: session.session_date,
    status: session.status,
    group_title: session.group_title || '',
    presentations: updatedPres
  });
});

sessionRouter.get('/sessions/:sid', authMiddleware, (req, res) => {
  const sid = parsePositiveInt(req.params.sid);
  const user = (req as any).user as User;
  const s = sid ? db.sessions.find(x => x.id === sid) : undefined;
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (!canOwn(user, s.owner_id)) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα πρόσβασης' });
  }

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
      vote_count: getVoteCount(p.id, s.status === 'COMPLETED' || s.status === 'ARCHIVED')
    }));

  const criteria = db.criteria.filter(c => c.session_id === sid).sort((a, b) => a.position - b.position).map(c => ({ id: c.id, name: c.name, weight: c.weight }));
  const course = db.courses.find(c => c.id === s.course_id);
  const period = db.periods.find(p => p.id === s.period_id);
  const group = db.groups.find(g => g.id === s.group_id);
  const calculated = (s.status === 'COMPLETED' || s.status === 'ARCHIVED' || s.results_revealed) ? calculateResults(sid!) : null;

  res.json({
    id: s.id, public_id: s.public_id, title: s.title, status: s.status, session_date: s.session_date,
    course_name: course?.name || s.archive_snapshot?.course_name || '',
    period_name: period?.name || s.archive_snapshot?.period_name || '',
    group_title: s.group_title || group?.title || s.archive_snapshot?.group_title || '',
    branding: effectiveBranding(course),
    lock_new_participants: s.lock_new_participants,
    is_demo: s.is_demo,
    results_revealed: s.results_revealed,
    presentations,
    criteria,
    results: calculated || s.archive_snapshot?.results || null,
    participation_url: `${config.publicBaseUrl.replace(/\/$/, '')}/join/${s.public_id}`,
    archive_snapshot: s.archive_snapshot,
    owner_id: s.owner_id
  });
});
