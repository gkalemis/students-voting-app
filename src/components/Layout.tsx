import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { LanguageButton } from './LanguageButton';
import { ThemePicker } from './ThemePicker';
import { toGreekUppercase } from '../utils/greek';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useT();
  const location = useLocation();
  const [isGearOpen, setIsGearOpen] = useState(false);
  const gearRef = useRef<HTMLDivElement>(null);
  const canNavigate = !user?.must_change_password;

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname.startsWith('/session/');
    return location.pathname === path;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (gearRef.current && !gearRef.current.contains(event.target as Node)) {
        setIsGearOpen(false);
      }
    }
    if (isGearOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGearOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsGearOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <nav>
        <Link className="brand-home" to="/">
          🏛️ {t('app')}
        </Link>

        {/* Distinct User Profile Badge (visually differentiated from tabs) */}
        {user && (
          <div
            className="nav-user-badge"
            title={`${user.full_name} (@${user.username})`}
          >
            <span className="nav-user-avatar" aria-hidden="true">
              {user.role === 'ADMIN' ? '🛡️' : '🎓'}
            </span>
            <span className="nav-user-name">{user.full_name}</span>
            {user.role === 'ADMIN' && (
              <span className="nav-user-tag" lang="el">
                {toGreekUppercase('ADMIN')}
              </span>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        {canNavigate && (
          <Link
            to="/dashboard"
            className={`nav-tab-link ${isActive('/dashboard') ? 'active-tab' : ''}`}
          >
            {t('dashboard')}
          </Link>
        )}

        {canNavigate && user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            className={`nav-tab-link ${isActive('/admin') ? 'active-tab' : ''}`}
          >
            {t('admin')}
          </Link>
        )}

        {/* Language Selection with Flags */}
        <LanguageButton />

        {/* Gear Dropdown containing Account and Sign out */}
        <div className="nav-gear-container" ref={gearRef}>
          <button
            type="button"
            className={`nav-gear-btn ${isGearOpen ? 'open' : ''} ${location.pathname === '/account' ? 'active-gear' : ''}`}
            onClick={() => setIsGearOpen(prev => !prev)}
            aria-label={`${t('account')} · ${t('logout')}`}
            aria-haspopup="true"
            aria-expanded={isGearOpen}
            title={`${t('account')} & ${t('logout')}`}
          >
            <span className="gear-icon" aria-hidden="true">⚙️</span>
            <span className="gear-arrow" aria-hidden="true">▾</span>
          </button>

          {isGearOpen && (
            <div className="nav-gear-dropdown" role="menu">
              <div className="gear-dropdown-header">
                <div className="gear-dropdown-name">{user?.full_name}</div>
                <div className="gear-dropdown-username">@{user?.username}</div>
              </div>

              <div className="gear-dropdown-divider" />

              <Link
                to="/account"
                className={`gear-dropdown-item ${location.pathname === '/account' ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setIsGearOpen(false)}
              >
                <span className="gear-dropdown-icon">👤</span>
                <span>{t('account')}</span>
              </Link>

              <div className="gear-dropdown-divider" />

              <button
                type="button"
                className="gear-dropdown-item gear-dropdown-logout"
                role="menuitem"
                onClick={() => {
                  setIsGearOpen(false);
                  logout();
                }}
              >
                <span className="gear-dropdown-icon">🚪</span>
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="container">{children}</main>
      <ThemePicker />
    </>
  );
}
