import { db, getVoteCount } from './db';
import { broadcastSession } from './ws';
import { scheduleSave } from './persistence';

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
  scheduleSave();
}

export function clearPresentationTimer(pid: number) {
  if (autoCloseTimers.has(pid)) {
    clearTimeout(autoCloseTimers.get(pid)!);
    autoCloseTimers.delete(pid);
  }
}

export function scheduleAutoClose(sid: number, pid: number, closesAtStr: string) {
  clearPresentationTimer(pid);
  const delay = Math.max(50, new Date(closesAtStr).getTime() - Date.now() + 50);
  const timer = setTimeout(() => {
    autoClosePresentation(sid, pid);
  }, delay);
  autoCloseTimers.set(pid, timer);
}

