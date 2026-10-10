import React from 'react';
import { useT } from '../context/LocaleContext';

export function LanguageButton() {
  const { t, toggle, language } = useT();
  return (
    <button
      type="button"
      className="language"
      onClick={toggle}
      title={language === 'el' ? 'Switch to English' : 'Αλλαγή σε Ελληνικά'}
      aria-label={t('language')}
    >
      🌐 {t('language')}
    </button>
  );
}
