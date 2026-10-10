import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, userJson } from '../db';
import { adminMiddleware } from '../middleware';
import { User } from '../types';

export const userRouter = Router();

userRouter.use(adminMiddleware);

userRouter.get('/', (req, res) => {
  res.json(db.users.map(userJson));
});

userRouter.post('/', (req, res) => {
  const { username, full_name, password, role } = req.body;
  if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ detail: 'Το όνομα χρήστη υπάρχει ήδη' });
  }
  const newUser: User = {
    id: db.nextUserId++,
    username,
    full_name,
    password_hash: bcrypt.hashSync(password, 10),
    role: role || 'LECTURER',
    active: true,
    must_change_password: true, // newly created users must change password on first login
    auth_version: 0,
    theme_color: '#0e2a47'
  };
  db.users.push(newUser);
  res.status(201).json(userJson(newUser));
});

userRouter.patch('/:uid', (req, res) => {
  const user = db.users.find(u => u.id === Number(req.params.uid));
  if (!user) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  const currentUser = (req as any).user as User;
  if (req.body.active !== undefined) {
    if (user.id === currentUser.id && !req.body.active) {
      return res.status(400).json({ detail: 'Δεν μπορείτε να απενεργοποιήσετε τον εαυτό σας' });
    }
    user.active = Boolean(req.body.active);
    user.auth_version++;
  }
  if (req.body.password) {
    user.password_hash = bcrypt.hashSync(req.body.password, 10);
    user.auth_version++;
  }
  if (req.body.must_change_password !== undefined) {
    user.must_change_password = Boolean(req.body.must_change_password);
  }
  res.json(userJson(user));
});

userRouter.post('/:uid/reset-password', (req, res) => {
  const user = db.users.find(u => u.id === Number(req.params.uid));
  if (!user) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  // Custom password provided or generate a strong temp password
  const tempPassword = req.body.password?.trim() || `Temp!${Math.random().toString(36).substring(2, 7)}2025`;
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
  const user = db.users.find(u => u.id === Number(req.params.uid));
  if (!user) return res.status(404).json({ detail: 'Δεν βρέθηκε' });
  const currentUser = (req as any).user as User;
  if (user.id === currentUser.id) {
    return res.status(400).json({ detail: 'Δεν μπορείτε να διαγράψετε τον εαυτό σας' });
  }
  const adminId = currentUser.id;
  // Reassign owned periods, courses, groups, sessions to current admin
  db.periods.forEach(p => { if (p.owner_id === user.id) p.owner_id = adminId; });
  db.courses.forEach(c => { if (c.owner_id === user.id) c.owner_id = adminId; });
  db.groups.forEach(g => { if (g.owner_id === user.id) g.owner_id = adminId; });
  db.sessions.forEach(s => { if (s.owner_id === user.id) s.owner_id = adminId; });

  db.users = db.users.filter(u => u.id !== user.id);
  res.status(204).send();
});
