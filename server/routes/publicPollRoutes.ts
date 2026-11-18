import crypto from 'crypto';
import { Router } from 'express';
import { db, effectiveBranding, hashToken } from '../db';
import { SECRET_KEY } from '../middleware';
import { broadcastSession } from '../ws';
import { calculatePollQuestionResults } from '../pollHelpers';
import { createRateLimiter, isValidPublicId } from '../security';

export const publicPollRouter = Router();

const pollTokenLimiter = createRateLimiter({
  bucketKey: 'public_poll_tokens',
  windowMs: 60_000,
  max: 300,
  message: 'Πάρα πολλά αιτήματα εισόδου· περιμένετε λίγο'
});

const pollAnswerLimiter = createRateLimiter({
  bucketKey: 'public_poll_answers',
  windowMs: 60_000,
  max: 60,
  clientKey: req => hashToken(String(req.headers['x-participation-token'] || req.body?.token || req.ip)),
  message: 'Πάρα πολλές υποβολές· περιμένετε λίγο'
});

function resolvePublicPoll(rawPublicId: unknown) {
  if (!isValidPublicId(rawPublicId)) return undefined;
  return db.polls.find(p => p.public_id === rawPublicId);
}

function issuePollVoterToken(publicId: string): { token: string; expires_at: string } {
  const jti = crypto.randomBytes(16).toString('base64url');
  const expMs = Date.now() + 6 * 3600 * 1000;
  const payload = `${publicId}.${jti}.${expMs}`;
  const sig = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('base64url');
  return {
    token: `ptv1.${jti}.${expMs}.${sig}`,
    expires_at: new Date(expMs).toISOString()
  };
}

function verifyPollVoterToken(rawToken: unknown, publicId: string): string | null {
  if (typeof rawToken !== 'string') return null;
  const parts = rawToken.split('.');
  if (parts.length !== 4 || parts[0] !== 'ptv1') return null;
  const [, jti, expStr, sig] = parts;
  if (!jti || !expStr || !sig) return null;
  const expMs = Number(expStr);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return null;

  const expectedSig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${publicId}.${jti}.${expStr}`)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  return hashToken(`${publicId}:${jti}`);
}

publicPollRouter.get('/public/polls/:publicId', (req, res) => {
  const poll = resolvePublicPoll(req.params.publicId);
  if (!poll) return res.status(404).json({ detail: 'Το poll δεν βρέθηκε' });

  const course = db.courses.find(c => c.id === poll.course_id);
  const period = db.periods.find(pr => pr.id === poll.period_id);
  const questions = db.pollQuestions.filter(q => q.poll_id === poll.id).sort((a, b) => a.position - b.position);
  const visibleQuestions = questions.filter(q => q.status !== 'SKIPPED');

  const activeQuestion = poll.active_question_id
    ? (db.pollQuestions.find(q => q.id === poll.active_question_id && q.status !== 'SKIPPED') || null)
    : null;
  const activeQuestionResult = activeQuestion ? calculatePollQuestionResults(activeQuestion.id) : null;
  const displayPos = activeQuestion ? visibleQuestions.findIndex(q => q.id === activeQuestion.id) : -1;

  res.json({
    id: poll.id,
    public_id: poll.public_id,
    title: poll.title,
    course_name: poll.course_name || course?.name || '',
    period_name: poll.period_name || period?.name || '',
    session_date: poll.session_date,
    status: poll.status,
    show_results: poll.show_results,
    active_question: activeQuestion ? {
      id: activeQuestion.id,
      text: activeQuestion.text,
      type: activeQuestion.type,
      options: activeQuestion.options,
      status: activeQuestion.status,
      position: displayPos >= 0 ? displayPos : activeQuestion.position,
      correct_option_index: poll.show_results ? activeQuestion.correct_option_index : null
    } : null,
    results: poll.show_results && activeQuestionResult ? activeQuestionResult : null,
    total_questions: visibleQuestions.length || questions.length,
    branding: effectiveBranding(course)
  });
});

publicPollRouter.post('/public/polls/:publicId/tokens', pollTokenLimiter, (req, res) => {
  const poll = resolvePublicPoll(req.params.publicId);
  if (!poll) return res.status(404).json({ detail: 'Το poll δεν βρέθηκε' });
  if (poll.status !== 'ACTIVE') {
    return res.status(409).json({ detail: 'Το poll δεν είναι ενεργό' });
  }
  res.json(issuePollVoterToken(poll.public_id));
});

publicPollRouter.post('/public/polls/:publicId/answer', createRateLimiter({bucketKey:'poll_answers_ip',windowMs:60_000,max:1200}), pollAnswerLimiter, (req, res) => {
  const poll = resolvePublicPoll(req.params.publicId);
  if (!poll || poll.status !== 'ACTIVE') {
    return res.status(409).json({ detail: 'Το poll δεν είναι ενεργό' });
  }

  const headerToken = req.headers['x-participation-token'];
  const rawToken = Array.isArray(headerToken) ? headerToken[0] : (headerToken || req.body?.token);
  const studentKey = verifyPollVoterToken(rawToken, poll.public_id);
  if (!studentKey) {
    return res.status(401).json({ detail: 'Μη έγκυρο διακριτικό συμμετοχής' });
  }

  const { question_id, selected_index } = req.body || {};
  const q = db.pollQuestions.find(x => x.id === Number(question_id) && x.poll_id === poll.id);
  if (!q || q.status !== 'OPEN') {
    return res.status(409).json({ detail: 'Η ψηφοφορία για αυτή την ερώτηση έχει κλείσει' });
  }

  const selIdx = Number(selected_index);
  if (!Number.isInteger(selIdx) || selIdx < 0 || selIdx >= q.options.length) {
    return res.status(422).json({ detail: 'Μη έγκυρη επιλογή απάντησης' });
  }

  const existing = db.pollAnswers.find(a => a.question_id === q.id && String(a.token_id) === studentKey);
  if (existing) {
    existing.selected_index = selIdx;
  } else {
    db.pollAnswers.push({
      id: db.nextPollAnswerId++,
      poll_id: poll.id,
      question_id: q.id,
      token_id: studentKey,
      selected_index: selIdx
    });
  }

  broadcastSession(poll.public_id, 'poll_vote_cast');
  res.json({ ok: true });
});
