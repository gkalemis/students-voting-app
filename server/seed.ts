import bcrypt from 'bcryptjs';
import { db } from './db';
import { User } from './types';

export function seedInitialData() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  const existingAdmin = db.users.find(u => u.username.toLowerCase() === adminUsername.toLowerCase() || u.role === 'ADMIN');
  if (existingAdmin) {
    if (!bcrypt.compareSync(adminPassword, existingAdmin.password_hash)) {
      existingAdmin.password_hash = bcrypt.hashSync(adminPassword, 10);
      existingAdmin.must_change_password = false;
      existingAdmin.active = true;
    }
  }

  if (db.users.length > 0) return;

  const adminHash = bcrypt.hashSync(adminPassword, 10);
  const lecturerHash = bcrypt.hashSync('lecturer123', 10);

  const admin: User = {
    id: db.nextUserId++,
    username: adminUsername,
    full_name: 'Administrator',
    password_hash: adminHash,
    role: 'ADMIN',
    active: true,
    must_change_password: false,
    auth_version: 0,
    theme_color: '#0e2a47'
  };
  db.users.push(admin);

  const lecturer: User = {
    id: db.nextUserId++,
    username: 'lecturer',
    full_name: 'Καθηγητής / Professor',
    password_hash: lecturerHash,
    role: 'LECTURER',
    active: true,
    must_change_password: false,
    auth_version: 0,
    theme_color: '#0e2a47'
  };
  db.users.push(lecturer);

  // Database is completely clean with zero pre-seeded courses, groups, or students (no ghost students).
}
