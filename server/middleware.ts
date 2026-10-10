import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User } from './types';
import { config } from './config';

export const SECRET_KEY = config.secretKey;

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Μη εξουσιοδοτημένη πρόσβαση' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SECRET_KEY) as { sub: string; role: string; ver: number };
    const user = db.users.find(u => u.id === Number(payload.sub));
    if (!user || !user.active || user.auth_version !== payload.ver) {
      return res.status(401).json({ detail: 'Μη έγκυρο διακριτικό' });
    }
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'Μη έγκυρο διακριτικό' });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    const user = (req as any).user as User;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ detail: 'Απαιτούνται δικαιώματα διαχειριστή' });
    }
    next();
  });
}
