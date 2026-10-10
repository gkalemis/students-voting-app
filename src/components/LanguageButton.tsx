import React from 'react';
import { useT } from '../context/LocaleContext';

function GreekFlagIcon() {
  return (
    <svg
      width="22"
      height="15"
      viewBox="0 0 27 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flag-svg"
      aria-hidden="true"
    >
      <rect width="27" height="18" fill="#0D5EAF" rx="2" />
      <path d="M0 2h27v2H0zm0 4h27v2H0zm0 4h27v2H0zm0 4h27v2H0z" fill="#fff" />
      <rect width="10" height="10" fill="#0D5EAF" />
      <path d="M4 0h2v10H4zM0 4h10v2H0z" fill="#fff" />
    </svg>
  );
}

function UKFlagIcon() {
  return (
    <svg
      width="22"
      height="15"
      viewBox="0 0 60 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flag-svg"
      aria-hidden="true"
    >
      <clipPath id="uk-flag-clip">
        <rect width="60" height="30" rx="4" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0 0L60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="2" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function LanguageButton() {
  const { language, setLanguage } = useT();

  return (
    <div className="flag-lang-toggle" role="group" aria-label="Language selection / Επιλογή γλώσσας">
      <button
        type="button"
        className={`flag-btn ${language === 'el' ? 'active' : ''}`}
        onClick={() => setLanguage('el')}
        title="Ελληνικά"
        aria-label="Ελληνικά"
      >
        <GreekFlagIcon />
      </button>
      <button
        type="button"
        className={`flag-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        title="English"
        aria-label="English"
      >
        <UKFlagIcon />
      </button>
    </div>
  );
}
