import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationKey } from '../i18n';

interface LocaleContextType {
  language: Language;
  t: (key: TranslationKey) => string;
  toggle: () => void;
  setLanguage: (lang: Language) => void;
}

export const LocaleContext = createContext<LocaleContextType>({
  language: 'el',
  t: (k: TranslationKey) => translations.el[k],
  toggle: () => {},
  setLanguage: () => {}
});

export const useT = () => useContext(LocaleContext);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) === 'en' ? 'en' : 'el';
  });

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('language', language);

    // Ensure all uppercase UI containers (tables, pills, badges, meta tags)
    // always carry lang="el" so the browser's CSS text-transform engine applies
    // Greek monotonic accent removal rules even when the app language is set to English.
    const ensureGreekUppercaseLang = () => {
      const selectors = 'th, .pill, .panel-section-title, .pres-meta-tag, .format-kicker, .csv-preview-table th, .resource-list';
      document.querySelectorAll(selectors).forEach(el => {
        if (!el.getAttribute('lang')) {
          el.setAttribute('lang', 'el');
        }
      });
    };

    ensureGreekUppercaseLang();
    const observer = new MutationObserver(ensureGreekUppercaseLang);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [language]);

  const toggle = () => {
    setLangState(prev => (prev === 'el' ? 'en' : 'el'));
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LocaleContext.Provider value={{ language, t, toggle, setLanguage: setLangState }}>
      {children}
    </LocaleContext.Provider>
  );
}
