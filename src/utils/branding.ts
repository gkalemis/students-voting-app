type LocalizedBranding = string | { el: string; en: string } | undefined;

export function getBrandingText(value: LocalizedBranding, language: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language as keyof typeof value] || value.el || value.en || '';
}
