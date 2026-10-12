import { Router } from 'express';
import { db, getVoteCount } from '../db';
import { authMiddleware } from '../middleware';
import { broadcastSession } from '../ws';
import { User } from '../types';
import { clearPresentationTimer, scheduleAutoClose } from '../timerService';

export const presentationRouter = Router();

function canManageSession(req: any, session: { owner_id: number }) {
  const user = req.user as User;
  return user.role === 'ADMIN' || session.owner_id === user.id;
}

function requireActiveSession(res: any, status: string) {
  if (status === 'ACTIVE') return true;
  res.status(400).json({ detail: 'Η συνεδρία δεν είναι ενεργή' });
  return false;
}

// Presentation Voting Actions
presentationRouter.post('/sessions/:sid/presentations/:pid/open', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (!canManageSession(req, s)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  if (!requireActiveSession(res, s.status)) return;

  db.presentations.filter(x => x.session_id === sid && x.status === 'VOTING_OPEN').forEach(op => {
    op.status = getVoteCount(op.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
    op.voting_closed_at = new Date().toISOString();
    clearPresentationTimer(op.id);
  });

  const durationSeconds = Math.min(3600, Math.max(5, Number(req.body?.duration ?? req.body?.seconds ?? s.voting_duration ?? 60) || 60));
  const now = new Date();
  p.status = 'VOTING_OPEN';
  p.voting_opened_at = now.toISOString();
  p.voting_closes_at = new Date(now.getTime() + durationSeconds * 1000).toISOString();
  s.criteria_locked = true;

  scheduleAutoClose(sid, pid, p.voting_closes_at);
  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true, closes_at: p.voting_closes_at, duration: durationSeconds });
});

presentationRouter.post('/sessions/:sid/presentations/:pid/reopen', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (!canManageSession(req, s)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  if (!requireActiveSession(res, s.status)) return;

  db.presentations.filter(x => x.session_id === sid && x.id !== pid && x.status === 'VOTING_OPEN').forEach(op => {
    op.status = getVoteCount(op.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
    op.voting_closed_at = new Date().toISOString();
    clearPresentationTimer(op.id);
  });

  const durationSeconds = Math.min(3600, Math.max(5, Number(req.body?.duration ?? req.body?.seconds ?? 60) || 60));
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
  if (!canManageSession(req, s)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  if (!requireActiveSession(res, s.status)) return;

  clearPresentationTimer(p.id);
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
  if (!canManageSession(req, s)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  if (!requireActiveSession(res, s.status)) return;

  const seconds = Math.min(600, Math.max(5, Number(req.body?.seconds || 30) || 30));
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
  if (!canManageSession(req, s)) return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  if (!requireActiveSession(res, s.status)) return;

  p.status = p.status === 'SKIPPED' ? 'PENDING' : 'SKIPPED';
  broadcastSession(s.public_id, 'state_changed');
  res.json({ status: p.status });
});

// Presentation Metadata Edit (Preserves all existing grades and votes)
presentationRouter.put('/sessions/:sid/presentations/:pid', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!s || !p) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }

  p.presenter_name = req.body.presenter_name || p.presenter_name;
  p.title = req.body.title !== undefined ? req.body.title : p.title;

  broadcastSession(s.public_id, 'presenter_updated');
  broadcastSession(s.public_id, 'state_changed');
  res.json({ id: p.id, presenter_name: p.presenter_name, title: p.title });
});

// Quick Add presenter during active or waiting session
presentationRouter.post('/sessions/:sid/presentations', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε η συνεδρία' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }
  if (s.status === 'ARCHIVED') {
    return res.status(400).json({ detail: 'Η συνεδρία είναι αρχειοθετημένη' });
  }

  const presenterName = (req.body.presenter_name || '').trim();
  if (!presenterName) {
    return res.status(400).json({ detail: 'Το όνομα είναι υποχρεωτικό' });
  }
  const title = (req.body.title || '').trim() || null;

  const sessionCriteria = db.criteria.filter(c => c.session_id === sid);
  const existingPres = db.presentations.filter(p => p.session_id === sid);
  const nextPos = existingPres.length > 0 ? Math.max(...existingPres.map(p => p.position)) + 1 : 0;

  const newP = {
    id: db.nextPresentationId++,
    session_id: sid,
    student_id: null,
    presenter_name: presenterName,
    title,
    position: nextPos,
    status: 'PENDING' as const,
    criteria: sessionCriteria.map(sc => ({ ...sc }))
  };

  db.presentations.push(newP);
  broadcastSession(s.public_id, 'state_changed');
  res.status(201).json(newP);
});

// Delete upcoming presentation (only PENDING allowed, protects completed presentations)
presentationRouter.delete('/sessions/:sid/presentations/:pid', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const pid = Number(req.params.pid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε η συνεδρία' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }
  if (s.status === 'ARCHIVED') {
    return res.status(400).json({ detail: 'Η συνεδρία είναι αρχειοθετημένη' });
  }

  const p = db.presentations.find(x => x.id === pid && x.session_id === sid);
  if (!p) return res.status(404).json({ detail: 'Δεν βρέθηκε η παρουσίαση' });

  if (p.status !== 'PENDING') {
    return res.status(400).json({ detail: 'Μόνο εκκρεμείς παρουσιάσεις που δεν έχουν ακόμη διεξαχθεί μπορούν να αφαιρεθούν' });
  }

  db.presentations = db.presentations.filter(x => x.id !== pid);
  db.votes = db.votes.filter(v => v.presentation_id !== pid);
  db.anonymousVoteScores = db.anonymousVoteScores.filter(v => v.presentation_id !== pid);

  broadcastSession(s.public_id, 'state_changed');
  res.status(204).send();
});

// Reorder upcoming presentations
presentationRouter.post('/sessions/:sid/presentations/reorder', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const user = (req as any).user as User;
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε η συνεδρία' });
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα' });
  }
  if (s.status === 'ARCHIVED') {
    return res.status(400).json({ detail: 'Η συνεδρία είναι αρχειοθετημένη' });
  }

  const { ordered_ids } = req.body;
  if (!Array.isArray(ordered_ids)) {
    return res.status(400).json({ detail: 'ordered_ids array required' });
  }

  ordered_ids.forEach((id: number, idx: number) => {
    const p = db.presentations.find(x => x.id === id && x.session_id === sid);
    if (p) {
      p.position = idx;
    }
  });

  broadcastSession(s.public_id, 'state_changed');
  res.json({ ok: true });
});
