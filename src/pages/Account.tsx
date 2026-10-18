import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';
import { PasswordInput } from '../components/PasswordInput';
import { safeStorage } from '../utils/storage';
import { applyThemeColor } from '../theme';

export function Account() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const { t, language } = useT();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    applyThemeColor('#0d9488');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirmation) {
      return setError(t('passwordMismatch'));
    }
    try {
      const result = await api('/auth/password', json('PUT', { current_password: current, new_password: next }));
      safeStorage.setItem('auth_token', result.access_token);
      setUser({ ...user!, must_change_password: false });
      setMessage(t('passwordChanged'));
      setTimeout(() => nav('/dashboard'), 700);
    } catch (e) {
      setError(translateError(e, language));
    }
  }

  return (
    <Layout>
      <section className="card login" style={{ margin: 'auto', borderTop: '4px solid #0d9488' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.1rem',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0d9488 0%, color-mix(in srgb, #0d9488 60%, #ffffff) 100%)',
          color: '#ffffff',
          marginBottom: '1.25rem'
        }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🔐</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
              {user?.must_change_password ? t('mandatoryPassword') : t('changePassword')}
            </h2>
            {user?.must_change_password && (
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: '#f0fdfa' }}>
                {t('temporaryReplace')}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={submit}>
          <label>
            {t('currentPassword')}
            <PasswordInput
              autoComplete="current-password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
            />
          </label>
          <label>
            {t('newPassword')}
            <PasswordInput
              autoComplete="new-password"
              minLength={10}
              value={next}
              onChange={e => setNext(e.target.value)}
              required
            />
          </label>
          <label>
            {t('confirmPassword')}
            <PasswordInput
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
