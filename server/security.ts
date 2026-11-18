import { Request, Response, NextFunction } from 'express';

interface RateBucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;
const stores = new Map<string, Map<string, RateBucket>>();

export function createRateLimiter(options: {
  bucketKey: string;
  windowMs: number;
  max: number;
  message?: string;
  clientKey?: (req: Request) => string;
}) {
  if (!stores.has(options.bucketKey)) {
    stores.set(options.bucketKey, new Map());
  }
  const store = stores.get(options.bucketKey)!;

  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      if (bucket.resetAt <= now) {
        store.delete(key);
      }
    }
  }, Math.max(options.windowMs, 30_000)).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const clientKey = options.clientKey ? options.clientKey(req) : `${ip}`;
    const now = Date.now();

    let bucket = store.get(clientKey);
    if (!bucket || bucket.resetAt <= now) {
      if (!bucket && store.size >= MAX_BUCKETS) {
        for (const [k, b] of store.entries()) {
          if (b.resetAt <= now) store.delete(k);
        }
        if (store.size >= MAX_BUCKETS) {
          const oldestKey = store.keys().next().value;
          if (oldestKey !== undefined) store.delete(oldestKey);
        }
      }
      bucket = { count: 1, resetAt: now + options.windowMs };
      store.set(clientKey, bucket);
      return next();
    }

    bucket.count++;
    if (bucket.count > options.max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        detail: options.message || 'Πάρα πολλές προσπάθειες· δοκιμάστε αργότερα'
      });
    }

    next();
  };
}

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function isValidPublicId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{4,64}$/.test(value);
}

export function parsePositiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function verifyImageMagicBytes(buf: Buffer, mimetype: string): boolean {
  if (buf.length < 12) return false;
  if (mimetype === 'image/png') {
    return (
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
    );
  }
  if (mimetype === 'image/jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mimetype === 'image/webp') {
    return (
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}
