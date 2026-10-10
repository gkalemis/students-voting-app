import React, { useState } from 'react';

interface AcademicLogoProps {
  logoUrl?: string | null;
  size?: number;
  className?: string;
  title?: string;
}

export function AcademicLogo({ logoUrl, size = 56, className = '', title }: AcademicLogoProps) {
  const [loadError, setLoadError] = useState(false);

  if (logoUrl && !loadError) {
    return (
      <img
        src={logoUrl}
        alt={title || 'Logo'}
        width={size}
        height={size}
        className={`academic-logo-img ${className}`}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, borderRadius: '8px' }}
        onError={() => setLoadError(true)}
      />
    );
  }

  // Polished vector academic seal / insignia with vibrant sapphire and gold tones
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`academic-logo-svg ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
      role="img"
      aria-label={title || 'Academic Crest'}
    >
      <circle cx="32" cy="32" r="30" fill="url(#crestGrad)" stroke="#f59e0b" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      {/* Classical Temple Pediment */}
      <path d="M20 25L32 15L44 25H20Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
      {/* Columns */}
      <rect x="23" y="27" width="3" height="15" rx="1" fill="#ffffff" />
      <rect x="29" y="27" width="3" height="15" rx="1" fill="#ffffff" />
      <rect x="35" y="27" width="3" height="15" rx="1" fill="#ffffff" />
      <rect x="41" y="27" width="3" height="15" rx="1" fill="#ffffff" />
      {/* Temple Base */}
      <rect x="19" y="42" width="26" height="3.5" rx="1" fill="#fbbf24" />
      {/* Laurel Wreath Accents */}
      <path d="M12 36C10 30 13 22 18 19" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 36C54 30 51 22 46 19" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      {/* Torch Flame / Star on top */}
      <circle cx="32" cy="12" r="2.5" fill="#f59e0b" />
      <defs>
        <linearGradient id="crestGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a8a" />
          <stop offset="0.6" stopColor="#0e2a47" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
