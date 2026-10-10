import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, userJson } from '../db';
import { authMiddleware, SECRET_KEY } from '../middleware';
import { User } from '../types';

export const authRouter = Router();
const loginAttempts = new Map<string, number[]>();
const dummyHash = bcrypt.hashSync('invalid-password-placeholder', 12);

function allowLogin(username: string): boolean {
  const now = Date.now();
  const recent = (loginAttempts.get(username) || []).filter(time => now - time < 300_000);
  if (recent.length >= 10) return false;
  recent.push(now); loginAttempts.set(username, recent); return true;
}

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = (username || '').trim().toLowerCase();
  if (!allowLogin(cleanUsername)) return res.status(429).json({ detail: 'Πάρα πολλές προσπάθειες· δοκιμάστε αργότερα' });
  const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);
  const isPasswordValid = bcrypt.compareSync(password || '', user?.password_hash || dummyHash);

  if (!user || !user.active || !isPasswordValid) {
    return res.status(401).json({ detail: 'Λανθασμένα στοιχεία σύνδεσης' });
  }
  loginAttempts.delete(cleanUsername);

  const token = jwt.sign(
    { sub: String(user.id), role: user.role, ver: user.auth_version },
    SECRET_KEY,
    { expiresIn: '12h' }
  );
  res.json({
    access_token: token,
    token_type: 'bearer',
    user: userJson(user)
  });
});

authRouter.get('/me', authMiddleware, (req, res) => {
  res.json(userJson((req as any).user));
});

authRouter.put('/password', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { current_password, new_password } = req.body;
  if (!new_password || typeof new_password !== 'string' || new_password.length < 10) {
    return res.status(400).json({ detail: 'Ο κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες' });
  }
  if (current_password) {
    if (!bcrypt.compareSync(current_password, user.password_hash)) {
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
    { expiresIn: '12h' }
  );
  res.json({ ok: true, access_token: token, user: userJson(user) });
});

authRouter.put('/theme', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { color } = req.body;
  if (!/^#[0-9a-f]{6}$/i.test(color || '')) return res.status(422).json({ detail: 'Μη έγκυρο χρώμα' });
  user.theme_color = color.toLowerCase();
  res.json({ theme_color: user.theme_color });
});
