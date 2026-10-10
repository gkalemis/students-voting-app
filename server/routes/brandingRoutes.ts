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

// Public
brandingRouter.get('/public/branding', (req, res) => {
  res.json(db.globalBranding);
});

// Admin
brandingRouter.get('/branding', adminMiddleware, (req, res) => {
  res.json(db.globalBranding);
});

brandingRouter.put('/branding', adminMiddleware, (req, res) => {
  for (const key of ['university_name', 'school_name', 'department_name', 'background_type', 'background_value', 'background_opacity']) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) (db.globalBranding as any)[key] = req.body[key];
  }
  res.json(db.globalBranding);
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
