import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { LanguageButton } from './LanguageButton';
import { ThemePicker } from './ThemePicker';
import { AppFooter } from './AppFooter';
import { toGreekUppercase } from '../utils/greek';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useT();
  const location = useLocation();
  const [isGearOpen, setIsGearOpen] = useState(false);
  const gearRef = useRef<HTMLDivElement>(null);
  const canNavigate = !user?.must_change_password;

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return (
        location.pathname === '/dashboard' ||
        location.pathname.startsWith('/session/') ||
        location.pathname.startsWith('/poll/')
      );
    }
    return location.pathname === path;
  };

  useEffect(() => {
    setIsGearOpen(false);
  }, [location.pathname]);

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
      <nav aria-label={t('app')}>
        <Link className="brand-home" to="/">
          <span className="brand-home-icon" aria-hidden="true">🏛️</span>
          <span className="brand-home-text">{t('app')}</span>
        </Link>

        <div className="nav-tabs-group">
          {canNavigate && (
            <Link
              to="/dashboard"
              className={`nav-tab-link ${isActive('/dashboard') ? 'active-tab' : ''}`}
            >
              <span className="nav-tab-icon" aria-hidden="true">📊</span>
              <span>{t('dashboard')}</span>
            </Link>
          )}

          {canNavigate && user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`nav-tab-link ${isActive('/admin') ? 'active-tab' : ''}`}
            >
              <span className="nav-tab-icon" aria-hidden="true">🛡️</span>
              <span>{t('admin')}</span>
            </Link>
          )}
        </div>

        <div className="nav-right-group">
          <LanguageButton />

          <div className="nav-gear-container" ref={gearRef}>
            <button
              type="button"
              className={`nav-gear-btn nav-user-menu-btn ${isGearOpen ? 'open' : ''} ${location.pathname === '/account' ? 'active-gear' : ''}`}
              onClick={() => setIsGearOpen(prev => !prev)}
              aria-label={`${user?.full_name || t('account')} · ${t('theme')} · ${t('logout')}`}
              aria-haspopup="menu"
              aria-expanded={isGearOpen}
              title={`${user?.full_name || t('account')} (@${user?.username || ''})`}
            >
              <span className="nav-user-avatar" aria-hidden="true">
                {user?.role === 'ADMIN' ? '🛡️' : '🎓'}
              </span>
              {user && <span className="nav-user-name">{user.full_name}</span>}
              {user?.role === 'ADMIN' && (
                <span className="nav-user-tag" lang="el">
                  {toGreekUppercase('ADMIN')}
                </span>
              )}
              <span className="gear-arrow" aria-hidden="true">▾</span>
            </button>

            {isGearOpen && (
              <div className="nav-gear-dropdown" role="menu">
                <div className="gear-dropdown-header">
                  <div className="gear-dropdown-name">{user?.full_name}</div>
                  <div className="gear-dropdown-username">@{user?.username}</div>
                </div>

                <div className="gear-dropdown-divider" />

                {canNavigate && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`gear-dropdown-item ${isActive('/dashboard') ? 'active' : ''}`}
                      role="menuitem"
                      onClick={() => setIsGearOpen(false)}
                    >
                      <span className="gear-dropdown-icon" aria-hidden="true">📊</span>
                      <span>{t('dashboard')}</span>
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className={`gear-dropdown-item ${isActive('/admin') ? 'active' : ''}`}
                        role="menuitem"
                        onClick={() => setIsGearOpen(false)}
                      >
                        <span className="gear-dropdown-icon" aria-hidden="true">🛡️</span>
                        <span>{t('admin')}</span>
                      </Link>
                    )}
                  </>
                )}

                <Link
                  to="/account"
                  className={`gear-dropdown-item ${location.pathname === '/account' ? 'active' : ''}`}
                  role="menuitem"
                  onClick={() => setIsGearOpen(false)}
                >
                  <span className="gear-dropdown-icon" aria-hidden="true">🔑</span>
                  <span>{t('changePassword')}</span>
                </Link>

                <div className="gear-dropdown-divider" />

                <ThemePicker />

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
                  <span className="gear-dropdown-icon" aria-hidden="true">🚪</span>
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="container">{children}</main>
      <AppFooter />
    </>
  );
}
