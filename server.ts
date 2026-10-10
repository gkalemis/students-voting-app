import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import { initPersistence, saveDatabaseSync, scheduleSave } from './server/persistence';
import { seedInitialData } from './server/seed';
import { db, getVoteCount } from './server/db';
import { setupWebSocket, broadcastSession } from './server/ws';
import { authRouter } from './server/routes/authRoutes';
import { userRouter } from './server/routes/userRoutes';
import { academicRouter } from './server/routes/academicRoutes';
import { sessionRouter } from './server/routes/sessionRoutes';
import { presentationRouter } from './server/routes/presentationRoutes';
import { publicRouter } from './server/routes/publicRoutes';
import { exportRouter } from './server/routes/exportRoutes';
import { brandingRouter, ASSETS_DIR } from './server/routes/brandingRoutes';
import { importRouter } from './server/routes/importRoutes';
import { config } from './server/config';

const PORT = config.port;

// Initialize persistence from data/db.json; seed if first run
initPersistence();
seedInitialData();
saveDatabaseSync();

// Background auto-expiry ticker: automatically closes voting when time expires
// and immediately broadcasts updates to projector, user, and lecturer screens
function checkExpiredVoting() {
  const now = Date.now();
  for (const session of db.sessions) {
    let sessionChanged = false;
    for (const p of db.presentations) {
      if (p.session_id === session.id && p.status === 'VOTING_OPEN') {
        if (p.voting_closes_at && new Date(p.voting_closes_at).getTime() <= now) {
          p.status = getVoteCount(p.id) > 0 ? 'EVALUATED' : 'NO_VOTES';
          p.voting_closed_at = new Date().toISOString();
          sessionChanged = true;
        }
      }
    }
    if (sessionChanged) {
      broadcastSession(session.public_id, 'state_changed');
      scheduleSave();
    }
  }
}
setInterval(checkExpiredVoting, 500);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const hostname = req.hostname.toLowerCase();
  if (config.production && !config.allowedHosts.includes(hostname)) {
    return res.status(400).json({ detail: 'Μη έγκυρος εξυπηρετητής' });
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  if (config.production) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use('/assets', express.static(ASSETS_DIR));

// Auto-save data on modifying requests
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        scheduleSave();
      }
    });
  }
  next();
});

import { adminMiddleware } from './server/middleware';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.4.0' });
});

// Completely clean / reset database
app.post('/api/admin/reset-db', adminMiddleware, (req, res) => {
  try {
    const dbFilePath = path.resolve('data', 'db.json');
    if (fs.existsSync(dbFilePath)) {
      fs.unlinkSync(dbFilePath);
    }
    db.periods = [];
    db.courses = [];
    db.groups = [];
    db.students = [];
    db.sessions = [];
    db.criteria = [];
    db.presentations = [];
    db.tokens = [];
    db.votes = [];
    db.anonymousVoteScores = [];
    db.users = [];
    db.nextUserId = 1;
    db.nextPeriodId = 1;
    db.nextCourseId = 1;
    db.nextGroupId = 1;
    db.nextStudentId = 1;
    db.nextSessionId = 1;
    db.nextCriterionId = 1;
    db.nextPresentationId = 1;
    db.nextTokenId = 1;
    db.nextVoteId = 1;

    seedInitialData();
    saveDatabaseSync();

    res.json({ ok: true, message: 'Η βάση δεδομένων εκκαθαρίστηκε πλήρως.' });
  } catch (err) {
    res.status(500).json({ detail: 'Αποτυχία εκκαθάρισης βάσης: ' + String(err) });
  }
});

// API Routes
app.use('/api', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api', academicRouter);
app.use('/api', sessionRouter);
app.use('/api', presentationRouter);
app.use('/api', exportRouter);
app.use('/api', brandingRouter);
app.use('/api', importRouter);

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    setupWebSocket(wss, request, socket, head);
  });

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist'))) {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: { server }, allowedHosts: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Presentation Voting server ready on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
