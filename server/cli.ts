import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { initPersistence, saveDatabaseSync } from './persistence';

function usage(): never {
  console.error('Usage: npm run reset-password -- USERNAME');
  process.exit(2);
}

const [command, username, ...extra] = process.argv.slice(2);
if (command !== 'reset-password' || !username || extra.length > 0) usage();

if (!initPersistence()) {
  console.error('No persistent database was found.');
  process.exit(1);
}

const user = db.users.find(candidate => candidate.username.toLowerCase() === username.toLowerCase());
if (!user) {
  console.error('User was not found.');
  process.exit(1);
}

const temporaryPassword = `Temp!${crypto.randomBytes(15).toString('base64url')}`;
user.password_hash = bcrypt.hashSync(temporaryPassword, 12);
user.must_change_password = true;
user.auth_version++;
saveDatabaseSync();

console.log(`Temporary password for ${user.username}: ${temporaryPassword}`);
console.log('The account must change this password at the next login.');
