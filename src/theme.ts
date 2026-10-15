import { safeStorage } from './utils/storage';

export const THEME_COLORS = [
  '#0d9488', // Teal (Primary default)
  '#0f766e', // Deep teal
  '#14b8a6', // Soft teal
  '#6cc5d2', // Pale turquoise / cyan
  '#f5cb5c', // Soft pale yellow / gold
  '#f39a75', // Pale peach / coral
  '#cbafeb', // Pale lavender
  '#7bc96f', // Pale spring green
  '#9bb8ed', // Pale cornflower blue
  '#f886b1', // Pale rose pink
  '#c6e569', // Pale lime / chartreuse
  '#8ae3ad', // Pale mint
  '#b49ad6', // Soft pale violet
  '#a8b2bc'  // Pale warm grey
];

export function applyThemeColor(color?: string) {
  let chosen = color || safeStorage.getItem('theme_color') || THEME_COLORS[0];
  if (chosen === '#0e2a47' || chosen === '#1d4ed8') {
    chosen = '#0d9488';
  }
  document.documentElement.style.setProperty('--accent', chosen);
  const hex = chosen.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  document.documentElement.style.setProperty('--accent-contrast', lum > 0.6 ? '#0f172a' : '#ffffff');
  if (color || chosen !== safeStorage.getItem('theme_color')) {
    safeStorage.setItem('theme_color', chosen);
  }
}
