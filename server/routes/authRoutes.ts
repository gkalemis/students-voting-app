import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, userJson } from '../db';
import { authMiddleware, clearAuthCookie, SECRET_KEY, setAuthCookie } from '../middleware';
import { User } from '../types';
import { createRateLimiter } from '../security';

export const authRouter = Router();
const loginAttempts = new Map<string, number[]>();
const dummyHash = bcrypt.hashSync('invalid-password-placeholder', 12);

function allowLogin(username: string): boolean {
  const now = Date.now();
  const recent = (loginAttempts.get(username) || []).filter(time => now - time < 300_000);
  if (recent.length >= 10) return false;
  recent.push(now); loginAttempts.set(username, recent); return true;
}

const loginLimiter = createRateLimiter({
  bucketKey: 'auth_login',
  windowMs: 60_000,
  max: 10,
  message: 'Πάρα πολλές αποτυχημένες προσπάθειες σύνδεσης· δοκιμάστε ξανά σε 1 λεπτό'
});

authRouter.post('/login', loginLimiter, (req, res) => {
  const rawUser = req.body?.username;
  const rawPass = req.body?.password;
  if (typeof rawUser !== 'string' || typeof rawPass !== 'string' || rawUser.length > 200 || rawPass.length > 200) {
    return res.status(400).json({ detail: 'Μη έγκυρη μορφή στοιχείων σύνδεσης' });
  }

  const cleanUsername = rawUser.trim().toLowerCase();
  if (!allowLogin(cleanUsername)) return res.status(429).json({ detail: 'Πάρα πολλές προσπάθειες· δοκιμάστε αργότερα' });
  const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

  const targetHash = user?.password_hash || dummyHash;
  const isPasswordValid = bcrypt.compareSync(rawPass, targetHash);

  if (!user || !user.active || !isPasswordValid) {
    return res.status(401).json({ detail: 'Λανθασμένα στοιχεία σύνδεσης' });
  }
  loginAttempts.delete(cleanUsername);

  const token = jwt.sign(
    { sub: String(user.id), role: user.role, ver: user.auth_version },
    SECRET_KEY,
    { expiresIn: '12h', algorithm: 'HS256' }
  );
  setAuthCookie(res, req, token);
  res.json({
    access_token: token,
    token_type: 'bearer',
    user: userJson(user)
  });
});

authRouter.post('/logout', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  user.auth_version++;
  clearAuthCookie(res, req);
  res.json({ ok: true });
});

authRouter.get('/me', authMiddleware, (req, res) => {
  res.json(userJson((req as any).user));
});

authRouter.put('/password', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { current_password, new_password } = req.body;
  if (typeof new_password !== 'string' || new_password.length < 10 || new_password.length > 200) {
    return res.status(400).json({ detail: 'Ο κωδικός πρέπει να έχει 10 έως 200 χαρακτήρες' });
  }
  if (typeof current_password === 'string' && current_password.length > 0) {
    if (current_password.length > 200 || !bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(400).json({ detail: 'Μη έγκυρος κωδικός' });
    }
    if (current_password === new_password) {
      return res.status(400).json({ detail: 'Ο νέος κωδικός πρέπει να είναι διαφορετικός' });
    }
  } else if (!user.must_change_password) {
    return res.status(400).json({ detail: 'Απαιτείται ο τρέχων κωδικός' });
  }
  user.password_hash = bcrypt.hashSync(new_password, 10);
  user.must_change_password = false;
  user.auth_version++;
  const token = jwt.sign(
    { sub: String(user.id), role: user.role, ver: user.auth_version },
    SECRET_KEY,
    { expiresIn: '12h', algorithm: 'HS256' }
  );
  setAuthCookie(res, req, token);
  res.json({ ok: true, access_token: token, user: userJson(user) });
});

authRouter.put('/theme', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const rawColor = typeof req.body?.color === 'string' ? req.body.color.trim().toLowerCase() : '';
  if (!/^#[0-9a-f]{6}$/.test(rawColor)) {
    return res.status(400).json({ detail: 'Μη έγκυρος κωδικός χρώματος' });
  }
  user.theme_color = rawColor;
  res.json({ theme_color: user.theme_color });
});
