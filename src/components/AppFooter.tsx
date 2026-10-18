import React from 'react';
import { useT } from '../context/LocaleContext';

interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className = '' }: AppFooterProps) {
  const { language } = useT();
  const currentYear = new Date().getFullYear();
  const creator = language === 'el' ? 'Γιώργος Καλέμης' : 'George Kalemis';
  const versionLabel = language === 'el' ? 'Έκδοση' : 'Version';

  return (
    <footer className={`app-global-footer ${className}`} role="contentinfo">
      <span>
        © {currentYear} {creator} · {versionLabel} 2.8.1
      </span>
    </footer>
  );
}
