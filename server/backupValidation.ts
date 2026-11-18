const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function stripPrototypeKeys<T>(value: T, depth = 0): T {
  if (depth > 30) {
    throw new Error('Υπέρβαση μέγιστου βάθους JSON');
  }
  if (Array.isArray(value)) {
    return value.map(item => stripPrototypeKeys(item, depth + 1)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (DANGEROUS_KEYS.has(k)) continue;
      clean[k] = stripPrototypeKeys(v, depth + 1);
    }
    return clean as T;
  }
  return value;
}

export function isSafeAssetOrHttpUrl(url: unknown): boolean {
  if (url === null || url === undefined || url === '') return true;
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/assets/')) return !trimmed.includes('..');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function sanitizeBrandingObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  const strOrLoc = (v: unknown) => {
    if (typeof v === 'string') return v.slice(0, 200);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      return {
        el: typeof o.el === 'string' ? o.el.slice(0, 200) : '',
        en: typeof o.en === 'string' ? o.en.slice(0, 200) : ''
      };
    }
    return undefined;
  };

  const uni = strOrLoc(src.university_name);
  if (uni !== undefined) out.university_name = uni;
  const sch = strOrLoc(src.school_name);
  if (sch !== undefined) out.school_name = sch;
  const dept = strOrLoc(src.department_name);
  if (dept !== undefined) out.department_name = dept;

  if (typeof src.background_type === 'string' && ['none', 'solid', 'color', 'gradient', 'image'].includes(src.background_type)) {
    out.background_type = src.background_type;
  }
  if (typeof src.background_value === 'string' && !/[;{}]|url\s*\(/i.test(src.background_value)) {
    out.background_value = src.background_value.slice(0, 200);
  }
  if (typeof src.background_opacity === 'number' && Number.isFinite(src.background_opacity)) {
    out.background_opacity = Math.min(1, Math.max(0, src.background_opacity));
  }
  if (isSafeAssetOrHttpUrl(src.logo_url)) {
    out.logo_url = src.logo_url || null;
  }
  if (isSafeAssetOrHttpUrl(src.background_image_url)) {
    out.background_image_url = src.background_image_url || null;
  }
  if (typeof src.enable_sample_fixture_button === 'boolean') {
    out.enable_sample_fixture_button = src.enable_sample_fixture_button;
  }
  if (typeof src.enable_demo === 'boolean') {
    out.enable_demo = src.enable_demo;
  }
  return out;
}

export const BACKUP_ARRAY_KEYS = [
  'users', 'periods', 'courses', 'groups', 'students',
  'sessions', 'criteria', 'presentations', 'tokens',
  'votes', 'anonymousVoteScores', 'polls', 'pollQuestions', 'pollAnswers'
] as const;

export function validateRestoredBackup(raw: unknown): { ok: true; data: any } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Μη έγκυρη δομή αντιγράφου ασφαλείας' };
  }

  let parsed: any;
  try {
    parsed = stripPrototypeKeys(raw);
  } catch {
    return { ok: false, error: 'Μη έγκυρη ή υπερβολικά ένθετη δομή JSON' };
  }

  if (!Array.isArray(parsed.users) || parsed.users.length === 0 || parsed.users.length > 5000) {
    return { ok: false, error: 'Το αντίγραφο πρέπει να περιέχει έγκυρο πίνακα χρηστών' };
  }

  for (const u of parsed.users) {
    if (
      !u || typeof u !== 'object' ||
      !Number.isInteger(u.id) || u.id <= 0 ||
      typeof u.username !== 'string' || !u.username.trim() ||
      typeof u.password_hash !== 'string' || !u.password_hash.startsWith('$2') ||
      (u.role !== 'ADMIN' && u.role !== 'LECTURER')
    ) {
      return { ok: false, error: 'Μη έγκυρη εγγραφή χρήστη στο αντίγραφο ασφαλείας' };
    }
  }

  const hasActiveAdmin = parsed.users.some((u: any) => u.role === 'ADMIN' && u.active !== false);
  if (!hasActiveAdmin) {
    return { ok: false, error: 'Το αντίγραφο πρέπει να περιέχει τουλάχιστον έναν ενεργό διαχειριστή (ADMIN)' };
  }

  for (const key of BACKUP_ARRAY_KEYS) {
    if (parsed[key] !== undefined && !Array.isArray(parsed[key])) {
      return { ok: false, error: `Μη έγκυρος πίνακας δεδομένων: ${key}` };
    }
    if (Array.isArray(parsed[key]) && parsed[key].length > 100_000) {
      return { ok: false, error: `Υπέρβαση ορίου εγγραφών στον πίνακα: ${key}` };
    }
  }

  if (Array.isArray(parsed.tokens)) {
    parsed.tokens = parsed.tokens.map((t: any) => {
      if (!t || typeof t !== 'object') return t;
      const { token: _raw, ...rest } = t;
      return rest;
    });
  }

  const error = validateBackupIntegrity(parsed);
  if (error) return { ok: false, error: 'Μη έγκυρα δεδομένα αντιγράφου ασφαλείας: ' + error };
  return { ok: true, data: parsed };
}
import { validateBackupIntegrity } from './backupIntegrity';
