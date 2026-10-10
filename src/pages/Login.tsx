import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Brand } from '../types';
import { BrandHeader } from '../components/BrandHeader';
import { LanguageButton } from '../components/LanguageButton';

export function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const { t, language } = useT();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [brand, setBrand] = useState<Brand>();

  useEffect(() => {
    api('/public/branding').then(setBrand).catch(() => {});
  }, []);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const r = await api('/auth/login', json('POST', { username, password }));
      localStorage.setItem('auth_token', r.access_token);
      setUser(r.user);
      nav(r.user.must_change_password ? '/account' : '/dashboard');
    } catch (e) {
      setErr(translateError(e, language));
    }
  }

  return (
    <main className="center">
      <section className="card login">
        <div className="corner-language">
          <LanguageButton />
        </div>
        <BrandHeader brand={brand} />
        <h1>{t('login')}</h1>

        <form onSubmit={go}>
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
            <input
              type="password"
              value={password}
              onChange={e => setP(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {err && <p className="error" role="alert">{err}</p>}

          <button style={{ width: '100%', marginTop: '.5rem' }}>{t('login')}</button>
        </form>

      </section>
    </main>
  );
}
