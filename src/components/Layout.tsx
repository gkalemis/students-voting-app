import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { LanguageButton } from './LanguageButton';
import { ThemePicker } from './ThemePicker';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useT();
  const location = useLocation();
  const canNavigate = !user?.must_change_password;

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname.startsWith('/session/');
    return location.pathname === path;
  };

  return (
    <>
      <nav>
        <Link className="brand-home" to="/">
          🏛️ {t('app')}
        </Link>
        <span style={{ fontWeight: 600 }}>{user?.full_name}</span>
        {canNavigate && (
          <Link
            to="/dashboard"
            className={`nav-tab-link ${isActive('/dashboard') ? 'active-tab' : ''}`}
          >
            {t('dashboard')}
          </Link>
        )}
        <Link
          to="/account"
          className={`nav-tab-link ${isActive('/account') ? 'active-tab' : ''}`}
        >
          {t('account')}
        </Link>
        {canNavigate && user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            className={`nav-tab-link ${isActive('/admin') ? 'active-tab' : ''}`}
          >
            {t('admin')}
          </Link>
        )}
        <LanguageButton />
        <button className="link" onClick={logout}>
          {t('logout')}
        </button>
      </nav>
      <main className="container">{children}</main>
      <ThemePicker />
    </>
  );
}
