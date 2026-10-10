import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';

export function Account() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const { t, language } = useT();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirmation) {
      return setError(t('passwordMismatch'));
    }
    try {
      const result = await api('/auth/password', json('PUT', { current_password: current, new_password: next }));
      localStorage.setItem('auth_token', result.access_token);
      setUser({ ...user!, must_change_password: false });
      setMessage(t('passwordChanged'));
      setTimeout(() => nav('/dashboard'), 700);
    } catch (e) {
      setError(translateError(e, language));
    }
  }

  return (
    <Layout>
      <section className="card login" style={{ margin: 'auto' }}>
        <h1>{user?.must_change_password ? t('mandatoryPassword') : t('changePassword')}</h1>
        {user?.must_change_password && <p>{t('temporaryReplace')}</p>}

        <form onSubmit={submit}>
          <label>
            {t('currentPassword')}
            <input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
            />
          </label>
          <label>
            {t('newPassword')}
            <input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={next}
              onChange={e => setNext(e.target.value)}
              required
            />
          </label>
          <label>
            {t('confirmPassword')}
            <input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
              required
            />
          </label>

          {error && <p className="error">{error}</p>}
          {message && <p className="notice">{message}</p>}

          <button style={{ width: '100%', marginTop: '.6rem' }}>{t('changePassword')}</button>
        </form>
      </section>
    </Layout>
  );
}
