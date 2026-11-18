import { User } from './types';
export const canOwn = (user: User, ownerId?: number | null) => user.role === 'ADMIN' || ownerId === user.id;
export const canAccessSession = (user: User, session: { owner_id?: number | null }) => canOwn(user, session.owner_id);
export function canManageSession(req: any, session: { owner_id: number }) {
  return canAccessSession(req.user as User, session);
}
export function requireActiveSession(res: any, status: string) {
  if (status === 'ACTIVE') return true;
  res.status(400).json({ detail: 'Η συνεδρία δεν είναι ενεργή' });
  return false;
}
export const clampDuration = (raw: unknown, fallback: number, min = 5, max = 3600) => {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
};
