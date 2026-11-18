import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User } from './types';
import { config } from './config';

export const SECRET_KEY = config.secretKey;

function extractCookieToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name === 'auth_token') {
      try { return decodeURIComponent(part.slice(idx + 1).trim()); } catch { return null; }
    }
  }
  return null;
}

export function setAuthCookie(res: Response, req: Request, token: string) {
  const isSecure = config.production || req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(isSecure),
    path: '/api',
    maxAge: 12 * 3600 * 1000
  });
}

export function clearAuthCookie(res: Response, req: Request) {
  const isSecure = config.production || req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(isSecure),
    path: '/api'
  });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = extractCookieToken(req);
    if (token && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.headers.origin;
      const expected = config.production ? config.publicBaseUrl : `${req.protocol}://${req.get('host')}`;
      if (origin !== expected) return res.status(403).json({ detail: 'Μη έγκυρη προέλευση αιτήματος' });
    }
  }
  if (!token) {
    return res.status(401).json({ detail: 'Μη εξουσιοδοτημένη πρόσβαση' });
  }
  try {
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }) as {
      sub: string;
      role: string;
      ver: number;
    };
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ detail: 'Μη έγκυρο διακριτικό' });
    }
    const user = db.users.find(u => u.id === userId);
    if (!user || !user.active || user.auth_version !== payload.ver) {
      return res.status(401).json({ detail: 'Μη έγκυρο διακριτικό' });
    }
    const authPath = req.originalUrl.split('?')[0];
    if (user.must_change_password && !['/api/auth/me', '/api/auth/password', '/api/auth/logout'].includes(authPath)) {
      return res.status(403).json({ detail: 'Ο προσωρινός κωδικός πρέπει να αντικατασταθεί πριν συνεχίσετε.' });
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
