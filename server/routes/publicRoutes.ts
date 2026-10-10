import { Router } from 'express';
import crypto from 'crypto';
import { db, effectiveBranding, getVoteCount, calculateResults, hashToken } from '../db';
import { broadcastSession } from '../ws';
import { ParticipationToken, Vote } from '../types';

export const publicRouter = Router();

// Public Session State & Voting
publicRouter.get('/public/sessions/:publicId', (req, res) => {
  const s = db.sessions.find(x => x.public_id === req.params.publicId);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  // Auto-close expired active presentation
  const activeP = db.presentations.find(p => p.session_id === s.id && p.status === 'VOTING_OPEN');
  if (activeP && activeP.voting_closes_at && new Date(activeP.voting_closes_at).getTime() < Date.now()) {
    activeP.status = getVoteCount(activeP.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
    activeP.voting_closed_at = new Date().toISOString();
    broadcastSession(s.public_id, 'state_changed');
  }
  const currentActiveP = db.presentations.find(p => p.session_id === s.id && p.status === 'VOTING_OPEN');

  const course = db.courses.find(c => c.id === s.course_id);
  const period = db.periods.find(p => p.id === s.period_id);
  const group = db.groups.find(g => g.id === s.group_id);
  const criteria = db.criteria.filter(c => c.session_id === s.id).sort((a, b) => a.position - b.position);
  const presentations = db.presentations
    .filter(p => p.session_id === s.id)
    .sort((a, b) => a.position - b.position)
    .map(p => ({
      id: p.id,
      presenter_name: p.presenter_name,
      title: p.title,
      status: p.status
    }));

  res.json({
    public_id: s.public_id,
    title: s.title,
    course: course?.name || '',
    period: period?.name || '',
    group: group?.title || '',
    session_date: s.session_date,
    status: s.status,
    lock_new_participants: s.lock_new_participants,
    results_revealed: s.results_revealed,
    active_presentation: currentActiveP ? {
      id: currentActiveP.id,
      presenter_name: currentActiveP.presenter_name,
      title: currentActiveP.title,
      closes_at: currentActiveP.voting_closes_at
    } : null,
    criteria: criteria.map(c => ({ id: c.id, name: c.name, weight: c.weight })),
    vote_count: currentActiveP ? getVoteCount(currentActiveP.id) : 0,
    participation_url: `/join/${s.public_id}`,
    branding: effectiveBranding(course),
    presentations,
    server_time: new Date().toISOString(),
    results: s.results_revealed ? calculateResults(s.id) : null
  });
});

publicRouter.post('/public/sessions/:publicId/tokens', (req, res) => {
  const s = db.sessions.find(x => x.public_id === req.params.publicId);
  if (!s || s.status !== 'ACTIVE') {
    return res.status(409).json({ detail: 'Η συνεδρία δεν είναι ενεργή' });
  }
  if (s.lock_new_participants) {
    return res.status(403).json({ detail: 'Η είσοδος νέων συμμετεχόντων είναι κλειδωμένη' });
  }

  const rawToken = crypto.randomBytes(24).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 6 * 3600 * 1000).toISOString();

  const tokenObj: ParticipationToken = {
    id: db.nextTokenId++,
    session_id: s.id,
    token: rawToken,
    token_hash: hashToken(rawToken),
    issued_at: now.toISOString(),
    expires_at: expiresAt,
    revoked: false
  };
  db.tokens.push(tokenObj);

  res.json({ token: rawToken, expires_at: expiresAt });
});

publicRouter.get('/public/sessions/:publicId/my-vote', (req, res) => {
  const tokenHeader = req.headers['x-participation-token'] as string;
  const s = db.sessions.find(x => x.public_id === req.params.publicId);
  if (!s || !tokenHeader) return res.json({ scores: {} });

  const tokenHash = hashToken(tokenHeader);
  const token = db.tokens.find(t => t.token_hash === tokenHash && t.session_id === s.id);
  if (!token) return res.json({ scores: {} });

  const activeP = db.presentations.find(p => p.session_id === s.id && p.status === 'VOTING_OPEN');
  if (!activeP) return res.json({ scores: {} });

  const vote = db.votes.find(v => v.presentation_id === activeP.id && v.token_id === token.id);
  res.json({ scores: vote ? vote.scores : {} });
});

publicRouter.put('/public/sessions/:publicId/vote', (req, res) => {
  const header = req.headers['x-participation-token'];
  const tokenHeader = Array.isArray(header) ? header[0] : header;
  const s = db.sessions.find(x => x.public_id === req.params.publicId);
  if (!s || !tokenHeader) {
    return res.status(401).json({ detail: 'Μη έγκυρο διακριτικό συμμετοχής' });
  }

  const tokenHash = hashToken(tokenHeader);
  const token = db.tokens.find(t => t.token_hash === tokenHash && t.session_id === s.id);
  if (!token) {
    return res.status(401).json({ detail: 'Μη έγκυρο διακριτικό συμμετοχής' });
  }
  if (token.revoked || new Date(token.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ detail: 'Το διακριτικό συμμετοχής έληξε' });
  }

  const activeP = db.presentations.find(p => p.session_id === s.id && p.status === 'VOTING_OPEN');
  
  // Check expiration
  if (activeP && activeP.voting_closes_at && new Date(activeP.voting_closes_at).getTime() < Date.now() - 5000) {
      activeP.status = getVoteCount(activeP.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
      activeP.voting_closed_at = new Date().toISOString();
      broadcastSession(s.public_id, 'state_changed');
  }

  if (!activeP || activeP.status !== 'VOTING_OPEN') {
    return res.status(409).json({ detail: 'Η ψηφοφορία έχει κλείσει' });
  }

  const criteria = db.criteria.filter(c => c.session_id === s.id);
  const scores: Record<number, number> = {};
  for (const c of criteria) {
    const val = Number(req.body.scores?.[c.id]);
    if (isNaN(val) || val < 1 || val > 5) {
      return res.status(422).json({ detail: 'Απαιτείται βαθμός 1–5 για κάθε κριτήριο' });
    }
    scores[c.id] = val;
  }

  let vote = db.votes.find(v => v.presentation_id === activeP.id && v.token_id === token.id);
  if (vote) {
    vote.scores = scores;
  } else {
    vote = {
      id: db.nextVoteId++,
      presentation_id: activeP.id,
      token_id: token.id,
      scores
    };
    db.votes.push(vote);
  }

  broadcastSession(s.public_id, 'vote_count_changed');
  res.json({ ok: true, vote_count: getVoteCount(activeP.id) });
});
