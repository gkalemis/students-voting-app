import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { adminMiddleware, clearAuthCookie } from '../middleware';
import { saveDatabaseSync } from '../persistence';
import { BACKUP_ARRAY_KEYS, sanitizeBrandingObject, validateRestoredBackup } from '../backupValidation';

export const backupRouter = Router();

const DATA_DIR = path.resolve('data');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okMime = ['application/json', 'text/json', 'text/plain', 'application/octet-stream'].includes(file.mimetype);
    if (ext !== '.json' && !okMime) {
      return cb(new Error('Επιτρέπονται μόνο αρχεία αντιγράφου ασφαλείας .json'));
    }
    cb(null, true);
  }
});

function nextIdFor(arr: any[], currentNext: unknown): number {
  const maxId = arr.reduce((max, item) => {
    const id = Number(item?.id);
    return Number.isFinite(id) && id > max ? id : max;
  }, 0);
  const candidate = Number(currentNext);
  return Number.isFinite(candidate) && candidate > maxId ? candidate : maxId + 1;
}

backupRouter.get('/admin/backup', adminMiddleware, (_req, res) => {
  try {
    const dateTag = new Date().toISOString().slice(0, 10);
    const sanitizedTokens = db.tokens.map(({ token: _raw, ...rest }) => rest);
    const payload = JSON.stringify({ ...db, tokens: sanitizedTokens }, null, 2);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="db-backup-${dateTag}.json"`);
    res.send(payload);
  } catch (err) {
    res.status(500).json({ detail: 'Αποτυχία εξαγωγής αντιγράφου ασφαλείας: ' + String(err) });
  }
});

function handleSingleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ detail: err.message || 'Μη έγκυρο αρχείο' });
    }
    next();
  });
}

backupRouter.post('/admin/backup/restore', adminMiddleware, handleSingleUpload, (req, res) => {
  const previous = structuredClone(db);
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ detail: 'Δεν επιλέχθηκε αρχείο αντιγράφου ασφαλείας (.json)' });
    }

    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch {
      return res.status(400).json({ detail: 'Το αρχείο δεν περιέχει έγκυρα δεδομένα JSON' });
    }

    const validation = validateRestoredBackup(rawParsed);
    if (!validation.ok) {
      return res.status(400).json({ detail: validation.error });
    }
    const parsed = validation.data;

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, `db.pre-restore.${Date.now()}.bak.json`),
      JSON.stringify(db, null, 2),
      { encoding: 'utf-8', mode: 0o600 }
    );

    for (const key of BACKUP_ARRAY_KEYS) {
      (db as any)[key] = Array.isArray(parsed[key]) ? parsed[key] : [];
    }

    if (parsed.globalBranding && typeof parsed.globalBranding === 'object') {
      Object.assign(db.globalBranding, sanitizeBrandingObject(parsed.globalBranding));
    }
    for (const user of db.users) {
      const oldVersion = previous.users.find(u => u.id === user.id)?.auth_version || 0;
      user.auth_version = Math.max(oldVersion, user.auth_version || 0) + 1;
      user.must_change_password ??= true;
    }

    db.nextUserId = nextIdFor(db.users, parsed.nextUserId);
    db.nextPeriodId = nextIdFor(db.periods, parsed.nextPeriodId);
    db.nextCourseId = nextIdFor(db.courses, parsed.nextCourseId);
    db.nextGroupId = nextIdFor(db.groups, parsed.nextGroupId);
    db.nextStudentId = nextIdFor(db.students, parsed.nextStudentId);
    db.nextSessionId = nextIdFor(db.sessions, parsed.nextSessionId);
    db.nextCriterionId = nextIdFor(db.criteria, parsed.nextCriterionId);
    db.nextPresentationId = nextIdFor(db.presentations, parsed.nextPresentationId);
    db.nextTokenId = nextIdFor(db.tokens, parsed.nextTokenId);
    db.nextVoteId = nextIdFor(db.votes, parsed.nextVoteId);
    db.nextPollId = nextIdFor(db.polls, parsed.nextPollId);
    db.nextPollQuestionId = nextIdFor(db.pollQuestions, parsed.nextPollQuestionId);
    db.nextPollAnswerId = nextIdFor(db.pollAnswers, parsed.nextPollAnswerId);

    saveDatabaseSync();
    clearAuthCookie(res, req);

    res.json({
      ok: true,
      summary: {
        users: db.users.length,
        sessions: db.sessions.length,
        polls: db.polls.length,
        pollQuestions: db.pollQuestions.length,
        pollAnswers: db.pollAnswers.length,
        votes: db.votes.length + db.anonymousVoteScores.length
      }
    });
  } catch (err) {
    Object.assign(db, previous);
    res.status(500).json({ detail: 'Αποτυχία επαναφοράς αντιγράφου: ' + String(err) });
  }
});
