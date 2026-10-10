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
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      Object.assign(db, parsed);
      console.log(`[Database] Loaded persistent data from ${DB_FILE}`);
      return true;
    }
  } catch (err) {
    console.warn('[Database] Failed to read existing db.json, falling back to seed:', err);
  }
  return false;
}

export function saveDatabaseSync(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = JSON.stringify(db, null, 2);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, payload, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[Database] Failed to write db.json:', err);
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
