import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { adminMiddleware, authMiddleware } from '../middleware';

export const brandingRouter = Router();

export const ASSETS_DIR = path.resolve('data/assets');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

const upload = multer({
  dest: ASSETS_DIR,
  limits: { fileSize: 5_000_000 }
});

// Public
brandingRouter.get('/public/branding', (req, res) => {
  res.json(db.globalBranding);
});

// Admin
brandingRouter.get('/branding', adminMiddleware, (req, res) => {
  res.json(db.globalBranding);
});

brandingRouter.put('/branding', adminMiddleware, (req, res) => {
  Object.assign(db.globalBranding, req.body);
  res.json(db.globalBranding);
});

brandingRouter.post('/branding/logo', adminMiddleware, upload.single('file'), (req, res) => {
  if (req.file) {
    db.globalBranding.logo_url = `/assets/${req.file.filename}`;
  }
  res.json(db.globalBranding);
});

brandingRouter.post('/branding/background', adminMiddleware, upload.single('file'), (req, res) => {
  if (req.file) {
    db.globalBranding.background_image_url = `/assets/${req.file.filename}`;
    db.globalBranding.background_type = 'image';
  }
  res.json(db.globalBranding);
});
