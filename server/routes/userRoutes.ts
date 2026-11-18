import crypto from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, userJson } from '../db';
import { adminMiddleware } from '../middleware';
import { parsePositiveInt } from '../security';
import { User } from '../types';

export const userRouter = Router();

userRouter.use(adminMiddleware);

userRouter.get('/', (_req, res) => {
  res.json(db.users.map(userJson));
});

userRouter.post('/', (req, res) => {
  const cleanUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const cleanFullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim().slice(0, 150) : '';
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const safeRole = req.body?.role === 'ADMIN' ? 'ADMIN' : 'LECTURER';

  if (!/^[a-zA-Z0-9._-]{3,100}$/.test(cleanUsername)) {
    return res.status(400).json({ detail: 'username: pattern must be 3-100 valid characters' });
  }
  if (!cleanFullName) {
    return res.status(400).json({ detail: 'full_name: required' });
  }
  if (rawPassword.length < 10 || rawPassword.length > 200) {
    return res.status(400).json({ detail: 'password: must be 10-200 characters' });
  }
  if (db.users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return res.status(409).json({ detail: 'Το όνομα χρήστη υπάρχει ήδη' });
  }
  const newUser: User = {
    id: db.nextUserId++,
    username: cleanUsername,
    full_name: cleanFullName,
    password_hash: bcrypt.hashSync(rawPassword, 10),
    role: safeRole,
    active: true,
    must_change_password: true,
    auth_version: 0,
    theme_color: '#0e2a47'
  };
  db.users.push(newUser);
  res.status(201).json(userJson(newUser));
});

userRouter.patch('/:uid', (req, res) => {
  const uid = parsePositiveInt(req.params.uid);
  const user = uid ? db.users.find(u => u.id === uid) : undefined;
  if (!user) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  const currentUser = (req as any).user as User;
  if (req.body.active !== undefined) {
    if (user.id === currentUser.id && !req.body.active) {
      return res.status(400).json({ detail: 'Δεν μπορείτε να απενεργοποιήσετε τον εαυτό σας' });
    }
    user.active = Boolean(req.body.active);
    user.auth_version++;
  }
  if (req.body.password !== undefined) {
    if (typeof req.body.password !== 'string' || req.body.password.length < 10 || req.body.password.length > 200) {
      return res.status(400).json({ detail: 'Ο κωδικός πρέπει να έχει 10 έως 200 χαρακτήρες' });
    }
    user.password_hash = bcrypt.hashSync(req.body.password, 10);
    user.must_change_password = true;
    user.auth_version++;
  }
  res.json(userJson(user));
});

userRouter.post('/:uid/reset-password', (req, res) => {
  const uid = parsePositiveInt(req.params.uid);
  const user = uid ? db.users.find(u => u.id === uid) : undefined;
  if (!user) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  const customPw = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
  if (customPw && (customPw.length < 10 || customPw.length > 200)) {
    return res.status(400).json({ detail: 'Ο κωδικός πρέπει να έχει 10 έως 200 χαρακτήρες' });
  }
  const tempPassword = customPw || `Tmp!${crypto.randomBytes(9).toString('base64url')}`;
  user.password_hash = bcrypt.hashSync(tempPassword, 10);
  user.must_change_password = true;
  user.auth_version++;

  res.json({
    ok: true,
    temporary_password: tempPassword,
    user: userJson(user)
  });
});

userRouter.delete('/:uid', (req, res) => {
  const uid = parsePositiveInt(req.params.uid);
  const user = uid ? db.users.find(u => u.id === uid) : undefined;
  if (!user) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  const currentUser = (req as any).user as User;
  if (user.id === currentUser.id) {
    return res.status(400).json({ detail: 'Δεν μπορείτε να διαγράψετε τον εαυτό σας' });
  }
  const adminId = currentUser.id;
  db.periods.forEach(p => { if (p.owner_id === user.id) p.owner_id = adminId; });
  db.courses.forEach(c => { if (c.owner_id === user.id) c.owner_id = adminId; });
  db.groups.forEach(g => { if (g.owner_id === user.id) g.owner_id = adminId; });
  db.sessions.forEach(s => { if (s.owner_id === user.id) s.owner_id = adminId; });
  db.polls.forEach(p => { if (p.owner_id === user.id) p.owner_id = adminId; });

  db.users = db.users.filter(u => u.id !== user.id);
  res.status(204).send();
});
