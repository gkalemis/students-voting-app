import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from '../db';
import { adminMiddleware, authMiddleware } from '../middleware';

export const brandingRouter = Router();

export const ASSETS_DIR = path.resolve('data/assets');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5_000_000 }
});

function storeImage(file?: Express.Multer.File): string | null {
  if (!file) return null;
  const signatures = [
    { mime: 'image/png', ext: '.png', valid: file.buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) },
    { mime: 'image/jpeg', ext: '.jpg', valid: file.buffer[0] === 0xff && file.buffer[1] === 0xd8 },
    { mime: 'image/webp', ext: '.webp', valid: file.buffer.subarray(0, 4).toString() === 'RIFF' && file.buffer.subarray(8, 12).toString() === 'WEBP' }
  ];
  const match = signatures.find(item => item.mime === file.mimetype && item.valid);
  if (!match) throw new Error('INVALID_IMAGE');
  const filename = `${crypto.randomBytes(20).toString('hex')}${match.ext}`;
  fs.writeFileSync(path.join(ASSETS_DIR, filename), file.buffer, { flag: 'wx', mode: 0o600 });
  return filename;
}

function brandingText(value: unknown) {
  if (typeof value === 'string' && value.length <= 200) return value;
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    if (typeof item.el === 'string' && typeof item.en === 'string' && item.el.length <= 200 && item.en.length <= 200) {
      return { el: item.el, en: item.en };
    }
  }
  throw new Error('INVALID_BRANDING');
}

// Public
brandingRouter.get('/public/branding', (req, res) => {
  res.json(db.globalBranding);
});

// Admin
brandingRouter.get('/branding', adminMiddleware, (req, res) => {
  res.json(db.globalBranding);
});

brandingRouter.put('/branding', adminMiddleware, (req, res) => {
  try {
    for (const key of ['university_name', 'school_name', 'department_name'] as const) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) db.globalBranding[key] = brandingText(req.body[key]);
    }
    if (req.body.background_type !== undefined) {
      if (!['none', 'solid', 'gradient', 'image'].includes(req.body.background_type)) throw new Error('INVALID_BRANDING');
      db.globalBranding.background_type = req.body.background_type;
    }
    if (req.body.background_value !== undefined) {
      if (typeof req.body.background_value !== 'string' || req.body.background_value.length > 200) throw new Error('INVALID_BRANDING');
      db.globalBranding.background_value = req.body.background_value;
    }
    if (req.body.background_opacity !== undefined) {
      const opacity = Number(req.body.background_opacity);
      if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new Error('INVALID_BRANDING');
      db.globalBranding.background_opacity = opacity;
    }
    res.json(db.globalBranding);
  } catch { res.status(422).json({ detail: 'Μη έγκυρα στοιχεία ιδρυματικής ταυτότητας' }); }
});

brandingRouter.post('/branding/logo', adminMiddleware, upload.single('file'), (req, res) => {
  try {
    const filename = storeImage(req.file);
    if (filename) db.globalBranding.logo_url = `/assets/${filename}`;
    res.json(db.globalBranding);
  } catch { res.status(415).json({ detail: 'Υποστηρίζονται μόνο έγκυρες εικόνες PNG, JPEG και WebP' }); }
});

brandingRouter.post('/branding/background', adminMiddleware, upload.single('file'), (req, res) => {
  try {
    const filename = storeImage(req.file);
    if (filename) { db.globalBranding.background_image_url = `/assets/${filename}`; db.globalBranding.background_type = 'image'; }
    res.json(db.globalBranding);
  } catch { res.status(415).json({ detail: 'Υποστηρίζονται μόνο έγκυρες εικόνες PNG, JPEG και WebP' }); }
});
