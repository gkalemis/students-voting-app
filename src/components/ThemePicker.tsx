import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';

import { THEME_COLORS, applyThemeColor } from '../theme';
export { THEME_COLORS, applyThemeColor };

export function ThemePicker() {
  const { user, setUser } = useAuth();
  const { t } = useT();

  useEffect(() => {
    const color = user?.theme_color || localStorage.getItem('theme_color') || THEME_COLORS[0];
    applyThemeColor(color);
  }, [user?.theme_color]);

  if (!user) return null;

  async function choose(color: string) {
    try {
      applyThemeColor(color);
      await api('/auth/theme', json('PUT', { color }));
      setUser({ ...user!, theme_color: color });
    } catch {
      // ignore
    }
  }

  return (
    <details className="theme-picker">
      <summary>{t('theme')}</summary>
      <small>{t('themeHint')}</small>
      <div className="swatches">
        {THEME_COLORS.map(color => (
          <button
            type="button"
            aria-label={color}
            title={color}
            key={color}
            className={`swatch ${user.theme_color === color ? 'selected' : ''}`}
            style={{ background: color }}
            onClick={() => choose(color)}
          />
        ))}
      </div>
    </details>
  );
}
