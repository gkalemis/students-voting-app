import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authMiddleware } from '../middleware';
import { parsePositiveInt } from '../security';
import { validSessionDate } from '../dates';
import { broadcastSession } from '../ws';
import { PollSession, PollQuestion } from '../pollTypes';
import {
  calculatePollQuestionResults,
  canAccessPoll,
  resolvePollCourseAndPeriod,
  sanitizePollQuestionInput
} from '../pollHelpers';

export const pollRouter = Router();

const ALLOWED_CONTROL_ACTIONS = new Set([
  'open_question', 'close_question', 'standby',
  'skip_question', 'restore_question', 'show_results',
  'hide_results', 'complete', 'reopen_poll'
]);

pollRouter.get('/polls', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const list = db.polls.filter(p => user.role === 'ADMIN' || p.owner_id === user.id);
  const items = list.map(p => {
    const course = db.courses.find(c => c.id === p.course_id);
    const period = db.periods.find(pr => pr.id === p.period_id);
    const questions = db.pollQuestions.filter(q => q.poll_id === p.id);
    return {
      ...p,
      course_name: p.course_name || course?.name || '',
      period_name: p.period_name || period?.name || '',
      questions_count: questions.length
    };
  });
  res.json(items);
});

pollRouter.post('/polls', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { title, course_id, period_id, course_name, period_name, session_date, questions } = req.body;
  if (!validSessionDate(session_date)) return res.status(422).json({ detail: 'Μη έγκυρη ημερομηνία συνεδρίας' });
  const cleanCourseName = typeof course_name === 'string' ? course_name.trim() : '';
  const cleanPeriodName = typeof period_name === 'string' ? period_name.trim() : '';

  if (!title || (!course_id && !cleanCourseName) || (!period_id && !cleanPeriodName)) {
    return res.status(400).json({ detail: 'Απαιτούνται τίτλος, μάθημα και ακαδημαϊκή περίοδος' });
  }

  const cleanTitle = String(title).trim().slice(0, 300);
  if (!cleanTitle) {
    return res.status(400).json({ detail: 'Απαιτείται έγκυρος τίτλος' });
  }

  const resolved = resolvePollCourseAndPeriod(user, { course_id, period_id, course_name, period_name });
  if (!resolved.ok) {
    return res.status(resolved.status).json({ detail: resolved.detail });
  }

  const publicId = crypto.randomBytes(6).toString('hex');
  const poll: PollSession = {
    id: db.nextPollId++,
    public_id: publicId,
    course_id: resolved.course_id,
    period_id: resolved.period_id,
    course_name: resolved.course_name,
    period_name: resolved.period_name,
    owner_id: user.id,
    session_date,
    title: cleanTitle,
    status: 'ACTIVE',
    active_question_id: null,
    show_results: false
  };
  db.polls.push(poll);

  if (Array.isArray(questions)) {
    questions.slice(0, 200).forEach((q: any, idx: number) => {
      const clean = sanitizePollQuestionInput(q, idx);
      db.pollQuestions.push({
        id: db.nextPollQuestionId++,
        poll_id: poll.id,
        ...clean,
        status: 'PENDING',
        position: idx
      });
    });
  }

  res.status(201).json(poll);
});

pollRouter.get('/polls/:id', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const pid = parsePositiveInt(req.params.id);
  const poll = pid ? db.polls.find(p => p.id === pid) : undefined;
  if (!poll) return res.status(404).json({ detail: 'Το poll δεν βρέθηκε' });
  if (!canAccessPoll(user, poll)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα πρόσβασης' });

  const course = db.courses.find(c => c.id === poll.course_id);
  const period = db.periods.find(pr => pr.id === poll.period_id);
  const questions = db.pollQuestions.filter(q => q.poll_id === poll.id).sort((a, b) => a.position - b.position);

  res.json({
    ...poll,
    course_name: poll.course_name || course?.name || '',
    period_name: poll.period_name || period?.name || '',
    questions: questions.map(q => ({ ...q, results: calculatePollQuestionResults(q.id) }))
  });
});

pollRouter.put('/polls/:id/control', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const pid = parsePositiveInt(req.params.id);
  const poll = pid ? db.polls.find(p => p.id === pid) : undefined;
  if (!poll) return res.status(404).json({ detail: 'Το poll δεν βρέθηκε' });
  if (!canAccessPoll(user, poll)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα ελέγχου' });

  const { action, question_id } = req.body || {};
  if (typeof action !== 'string' || !ALLOWED_CONTROL_ACTIONS.has(action)) {
    return res.status(400).json({ detail: 'Μη έγκυρη ενέργεια ελέγχου' });
  }

  const pollQs = db.pollQuestions.filter(q => q.poll_id === poll.id);
  if (['open_question','skip_question','restore_question'].includes(action) && !pollQs.some(q => q.id === Number(question_id))) {
    return res.status(404).json({ detail: 'Η ερώτηση δεν βρέθηκε' });
  }
  if (action === 'open_question' && question_id) {
    poll.status = 'ACTIVE';
    pollQs.forEach(q => {
      if (q.id === Number(question_id)) {
        q.status = 'OPEN';
        poll.active_question_id = q.id;
        poll.show_results = false;
      } else if (q.status === 'OPEN') {
        q.status = 'CLOSED';
      }
    });
  } else if (action === 'close_question') {
    const q = poll.active_question_id ? pollQs.find(x => x.id === poll.active_question_id) : null;
    if (q) q.status = 'CLOSED';
  } else if (action === 'standby') {
    pollQs.forEach(q => { if (q.status === 'OPEN') q.status = 'CLOSED'; });
    poll.active_question_id = null;
    poll.show_results = false;
  } else if (action === 'skip_question' && question_id) {
    const q = pollQs.find(x => x.id === Number(question_id));
    if (q) {
      q.status = 'SKIPPED';
      if (poll.active_question_id === q.id) { poll.active_question_id = null; poll.show_results = false; }
    }
  } else if (action === 'restore_question' && question_id) {
    const q = pollQs.find(x => x.id === Number(question_id));
    if (q && q.status === 'SKIPPED') q.status = 'PENDING';
  } else if (action === 'show_results') {
    poll.show_results = true;
  } else if (action === 'hide_results') {
    poll.show_results = false;
  } else if (action === 'complete') {
    poll.status = 'COMPLETED';
    pollQs.forEach(q => { if (q.status === 'OPEN') q.status = 'CLOSED'; });
  } else if (action === 'reopen_poll') {
    poll.status = 'ACTIVE';
  }

  broadcastSession(poll.public_id, 'poll_updated');
  res.json({ ok: true, poll });
});

pollRouter.put('/polls/:id', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const pid = parsePositiveInt(req.params.id);
  const poll = pid ? db.polls.find(p => p.id === pid) : undefined;
  if (!poll) return res.status(404).json({ detail: 'Το poll δεν βρέθηκε' });
  if (!canAccessPoll(user, poll)) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα επεξεργασίας' });
  }

  const { title, course_id, period_id, course_name, period_name, session_date, questions } = req.body || {};
  if (session_date !== undefined && !validSessionDate(session_date)) return res.status(422).json({ detail: 'Μη έγκυρη ημερομηνία συνεδρίας' });
  const resolved = resolvePollCourseAndPeriod(
    user,
    { course_id, period_id, course_name, period_name },
    { course_id: poll.course_id, period_id: poll.period_id, course_name: poll.course_name, period_name: poll.period_name }
  );
  if (!resolved.ok) {
    return res.status(resolved.status).json({ detail: resolved.detail });
  }

  poll.status = 'ACTIVE';
  poll.course_id = resolved.course_id;
  poll.period_id = resolved.period_id;
  poll.course_name = resolved.course_name;
  poll.period_name = resolved.period_name;
  if (typeof title === 'string' && title.trim()) poll.title = title.trim().slice(0, 300);
  if (session_date !== undefined) poll.session_date = session_date;

  if (Array.isArray(questions)) {
    const ownedQuestionIds = new Set(db.pollQuestions.filter(q => q.poll_id === poll.id).map(q => q.id));
    db.pollQuestions = db.pollQuestions.filter(q => q.poll_id !== poll.id);
    poll.active_question_id = null;
    poll.show_results = false;
    questions.slice(0, 200).forEach((q: any, idx: number) => {
      const clean = sanitizePollQuestionInput(q, idx);
      const candidateId = parsePositiveInt(q?.id);
      const qId = candidateId && ownedQuestionIds.has(candidateId) ? candidateId : db.nextPollQuestionId++;
      const question: PollQuestion = {
        id: qId,
        poll_id: poll.id,
        ...clean,
        status: 'PENDING',
        position: idx
      };
      db.pollQuestions.push(question);
    });
    const remainingIds = new Set(db.pollQuestions.filter(q => q.poll_id === poll.id).map(q => q.id));
    db.pollAnswers = db.pollAnswers.filter(a => a.poll_id !== poll.id || remainingIds.has(a.question_id));
  }

  broadcastSession(poll.public_id, 'poll_updated');
  res.json({ ok: true, poll });
});

pollRouter.delete('/polls/:id', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const pid = parsePositiveInt(req.params.id);
  const poll = pid ? db.polls.find(p => p.id === pid) : undefined;
  if (!poll) return res.status(404).json({ detail: 'Το poll δεν βρέθηκε' });
  if (!canAccessPoll(user, poll)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα διαγραφής' });
  db.polls = db.polls.filter(p => p.id !== pid);
  db.pollQuestions = db.pollQuestions.filter(q => q.poll_id !== pid);
  db.pollAnswers = db.pollAnswers.filter(a => a.poll_id !== pid);
  res.json({ ok: true });
});
