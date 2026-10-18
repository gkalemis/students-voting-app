import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { THEME_COLORS, applyThemeColor } from '../theme';
import { safeStorage } from '../utils/storage';
export { THEME_COLORS, applyThemeColor };

export function ThemePicker() {
  const { user, setUser } = useAuth();
  const { t } = useT();

  useEffect(() => {
    const color = user?.theme_color || safeStorage.getItem('theme_color') || THEME_COLORS[0];
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
    <div className="menu-theme-container">
      <div className="menu-theme-title">
        <span className="gear-dropdown-icon">🎨</span>
        <span>{t('theme')}</span>
      </div>
      <div className="menu-swatches">
        {THEME_COLORS.map(color => (
          <button
            type="button"
            aria-label={color}
            title={color}
            key={color}
            className={`menu-swatch ${user.theme_color === color ? 'selected' : ''}`}
            style={{ background: color }}
            onClick={() => choose(color)}
          />
        ))}
      </div>
    </div>
  );
}
