import fs from 'fs';
import path from 'path';
import { db } from './db';

const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let saveTimeout: NodeJS.Timeout | null = null;

export function initPersistence(): boolean {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      return false;
    }
    try { fs.chmodSync(DB_FILE, 0o600); } catch {}
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.users)) {
      throw new Error('Invalid database structure');
    }
    if (parsed && typeof parsed === 'object') {
      Object.assign(db, parsed);
      if (Array.isArray(db.users)) {
        for (const u of db.users) {
          if (u.theme_color === '#0e2a47' || u.theme_color === '#1d4ed8' || !u.theme_color) {
            u.theme_color = '#0d9488';
          }
        }
      }
      if (!Array.isArray(db.polls)) db.polls = [];
      if (!Array.isArray(db.pollQuestions)) db.pollQuestions = [];
      if (!Array.isArray(db.pollAnswers)) db.pollAnswers = [];
      if (!db.nextPollId) db.nextPollId = 1;
      if (!db.nextPollQuestionId) db.nextPollQuestionId = 1;
      if (!db.nextPollAnswerId) db.nextPollAnswerId = 1;
      console.log(`[Database] Loaded persistent data from ${DB_FILE}`);
      return true;
    }
  } catch (err) {
    throw new Error('Existing database could not be loaded; refusing to replace it', { cause: err });
  }
  return false;
}

export function saveDatabaseSync(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = JSON.stringify(db, null, 2);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, payload, { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tmpFile, DB_FILE);
    try { fs.chmodSync(DB_FILE, 0o600); } catch {}
  } catch (err) {
    console.error('[Database] Failed to write db.json:', err);
    throw err;
  }
}

export function scheduleSave(delayMs = 400): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    saveDatabaseSync();
  }, delayMs);
}

// Ensure database is saved before process termination
process.on('SIGINT', () => {
  saveDatabaseSync();
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveDatabaseSync();
  process.exit(0);
});
