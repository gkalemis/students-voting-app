export function getBrandingText(val: any, language: string): string {
  if (!val) return '';
  if (typeof val === 'object' && val !== null) {
    return val[language] || val['el'] || val['en'] || '';
  }
  return String(val);
}
