import { Router } from 'express';
import { db, getVoteCount } from '../db';
import { authMiddleware } from '../middleware';
import { broadcastSession } from '../ws';

export const presentationRouter = Router();

// In-memory timers for exact auto-close on voting expiration
const autoCloseTimers = new Map<number, NodeJS.Timeout>();

export function autoClosePresentation(sid: number, pid: number) {
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p || p.status !== 'VOTING_OPEN') return;

  p.status = getVoteCount(p.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
  p.voting_closed_at = new Date().toISOString();
  autoCloseTimers.delete(pid);
  broadcastSession(s.public_id, 'state_changed');
}

export function scheduleAutoClose(sid: number, pid: number, closesAtStr: string) {
  if (autoCloseTimers.has(pid)) {
    clearTimeout(autoCloseTimers.get(pid)!);
    autoCloseTimers.delete(pid);
  }
  const delay = Math.max(50, new Date(closesAtStr).getTime() - Date.now() + 50);
  const timer = setTimeout(() => {
    autoClosePresentation(sid, pid);
  }, delay);
  autoCloseTimers.set(pid, timer);
}

// 1-second safety interval to ensure any expired voting closes and notifies connected screens immediately
setInterval(() => {
  const now = Date.now();
  db.presentations
    .filter(p => p.status === 'VOTING_OPEN' && p.voting_closes_at && new Date(p.voting_closes_at).getTime() <= now)
    .forEach(p => {
      const s = db.sessions.find(x => x.id === p.session_id);
      p.status = getVoteCount(p.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
      p.voting_closed_at = new Date().toISOString();
      if (autoCloseTimers.has(p.id)) {
        clearTimeout(autoCloseTimers.get(p.id)!);
        autoCloseTimers.delete(p.id);
      }
      if (s) {
        broadcastSession(s.public_id, 'state_changed');
      }
    });
}, 1000);

// Presentation Actions
presentationRouter.post('/sessions/:sid/presentations/:pid/open', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  db.presentations.filter(x => x.session_id === sid && x.status === 'VOTING_OPEN').forEach(op => {
    op.status = getVoteCount(op.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
    op.voting_closed_at = new Date().toISOString();
    if (autoCloseTimers.has(op.id)) {
      clearTimeout(autoCloseTimers.get(op.id)!);
      autoCloseTimers.delete(op.id);
    }
  });

  const durationSeconds = Number(req.body?.duration ?? req.body?.seconds ?? s.voting_duration ?? 60);
  const now = new Date();
  p.status = 'VOTING_OPEN';
  p.voting_opened_at = now.toISOString();
  p.voting_closes_at = new Date(now.getTime() + durationSeconds * 1000).toISOString();
  s.criteria_locked = true;

  scheduleAutoClose(sid, pid, p.voting_closes_at);
  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true, closes_at: p.voting_closes_at, duration: durationSeconds });
});

// Reopen a closed or evaluated presentation (default 60s) for delayed responses
presentationRouter.post('/sessions/:sid/presentations/:pid/reopen', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  // Close any other currently active presentation first
  db.presentations.filter(x => x.session_id === sid && x.id !== pid && x.status === 'VOTING_OPEN').forEach(op => {
    op.status = getVoteCount(op.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
    op.voting_closed_at = new Date().toISOString();
    if (autoCloseTimers.has(op.id)) {
      clearTimeout(autoCloseTimers.get(op.id)!);
      autoCloseTimers.delete(op.id);
    }
  });

  // Default duration for delayed responses is 60 seconds
  const durationSeconds = Number(req.body?.duration ?? req.body?.seconds ?? 60);
  const now = new Date();
  p.status = 'VOTING_OPEN';
  p.voting_opened_at = now.toISOString();
  p.voting_closes_at = new Date(now.getTime() + durationSeconds * 1000).toISOString();

  scheduleAutoClose(sid, pid, p.voting_closes_at);
  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true, closes_at: p.voting_closes_at, duration: durationSeconds });
});

presentationRouter.post('/sessions/:sid/presentations/:pid/close', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  if (autoCloseTimers.has(p.id)) {
    clearTimeout(autoCloseTimers.get(p.id)!);
    autoCloseTimers.delete(p.id);
  }

  p.status = getVoteCount(p.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
  p.voting_closed_at = new Date().toISOString();

  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});

presentationRouter.post('/sessions/:sid/presentations/:pid/extend', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p || p.status !== 'VOTING_OPEN') return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  const seconds = Number(req.body?.seconds || 30);
  const currentClosesAt = p.voting_closes_at ? new Date(p.voting_closes_at).getTime() : Date.now();
  const base = Math.max(currentClosesAt, Date.now());
  p.voting_closes_at = new Date(base + seconds * 1000).toISOString();

  scheduleAutoClose(sid, pid, p.voting_closes_at);
  broadcastSession(s.public_id, 'state_changed');
  res.json({ closes_at: p.voting_closes_at });
});

presentationRouter.post('/sessions/:sid/presentations/:pid/skip', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  p.status = p.status === 'SKIPPED' ? 'PENDING' : 'SKIPPED';
  broadcastSession(s.public_id, 'state_changed');
  res.json({ status: p.status });
});

presentationRouter.put('/sessions/:sid/presentations/:pid', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  p.presenter_name = req.body.presenter_name || p.presenter_name;
  p.title = req.body.title !== undefined ? req.body.title : p.title;

  broadcastSession(s.public_id, 'presenter_updated');
  res.json({ id: p.id, presenter_name: p.presenter_name, title: p.title });
});
