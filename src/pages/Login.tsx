import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Brand } from '../types';
import { BrandHeader } from '../components/BrandHeader';
import { LanguageButton } from '../components/LanguageButton';
import { AppFooter } from '../components/AppFooter';
import { PasswordInput } from '../components/PasswordInput';
import { safeStorage } from '../utils/storage';
import { applyThemeColor } from '../theme';

export function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const { t, language } = useT();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [brand, setBrand] = useState<Brand>();

  useEffect(() => {
    applyThemeColor('#0d9488');
    api('/public/branding').then(setBrand).catch(() => {});
  }, []);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const r = await api('/auth/login', json('POST', { username, password }));
      safeStorage.setItem('auth_token', r.access_token);
      setUser(r.user);
      nav(r.user.must_change_password ? '/account' : '/dashboard');
    } catch (e) {
      setErr(translateError(e, language));
    }
  }

  return (
    <div className="login-page-wrapper">
      <main className="login-main-container">
        <section className="card login">
          <div className="login-top-bar">
            <div className="login-brand-wrapper">
              <BrandHeader brand={brand} />
            </div>
            <div className="login-lang-wrapper">
              <LanguageButton />
            </div>
          </div>

          <h1 className="login-heading">{t('login')}</h1>

          <form onSubmit={go} className="login-form">
            <label>
              {t('username')}
              <input
                value={username}
                onChange={e => setU(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              {t('password')}
              <PasswordInput
                value={password}
                onChange={e => setP(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {err && <p className="error" role="alert">{err}</p>}

            <button className="primary login-submit-btn">{t('login')}</button>
          </form>

        </section>
      </main>
      <AppFooter />
    </div>
  );
}
