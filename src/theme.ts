export const THEME_COLORS = [
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
  const chosen = color || localStorage.getItem('theme_color') || THEME_COLORS[0];
  document.documentElement.style.setProperty('--accent', chosen);
  const hex = chosen.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  document.documentElement.style.setProperty('--accent-contrast', lum > 0.6 ? '#0f172a' : '#ffffff');
  if (color) {
    localStorage.setItem('theme_color', color);
  }
}
