import bcrypt from 'bcryptjs';
import { config } from './config';
import { db } from './db';
import { User } from './types';

function removeUntouchedDemoLecturer() {
  if (!config.production) return;
  const demo = db.users.find(user => user.username === 'lecturer' && user.role === 'LECTURER');
  if (!demo || !bcrypt.compareSync('lecturer123', demo.password_hash)) return;
  const ownsData = [...db.periods, ...db.courses, ...db.groups, ...db.sessions]
    .some(record => record.owner_id === demo.id);
  if (!ownsData) db.users = db.users.filter(user => user.id !== demo.id);
}

export function seedInitialData() {
  removeUntouchedDemoLecturer();
  let admin = db.users.find(user => user.role === 'ADMIN');

  if (!admin) {
    if (!config.adminPassword || config.adminPassword.length < 10) {
      throw new Error('ADMIN_PASSWORD must contain at least 10 characters for initial bootstrap');
    }
    admin = {
      id: db.nextUserId++, username: config.adminUsername, full_name: 'Administrator',
      password_hash: bcrypt.hashSync(config.adminPassword, 12), role: 'ADMIN', active: true,
      must_change_password: config.production, auth_version: 0, theme_color: '#0e2a47'
    } as User;
    db.users.push(admin);
    return;
  }

  const knownDefault = bcrypt.compareSync('admin', admin.password_hash);
  if (config.production && knownDefault) {
    if (!config.adminPassword || config.adminPassword.length < 10 || config.adminPassword === 'admin') {
      throw new Error('Replace the default administrator password through ADMIN_PASSWORD before production startup');
    }
    admin.username = config.adminUsername;
    admin.password_hash = bcrypt.hashSync(config.adminPassword, 12);
    admin.must_change_password = true;
    admin.auth_version++;
    admin.active = true;
  }
}
