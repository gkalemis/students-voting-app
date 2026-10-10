import React, { useState } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';

export function ResetPasswordModal({
  user,
  close,
  done,
  failed
}: {
  user: any;
  close: () => void;
  done: () => void;
  failed: (e: any) => void;
}) {
  const { t } = useT();
  const [customPassword, setCustomPassword] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api(
        `/users/${user.id}/reset-password`,
        json('POST', customPassword ? { password: customPassword } : {})
      );
      if (res.temporary_password) {
        setTempPassword(res.temporary_password);
      } else {
        done();
      }
    } catch (err) {
      failed(err);
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 460 }}>
        <h2>🔑 {t('resetPassword')}</h2>
        <p style={{ margin: '0.4rem 0 1rem 0', color: '#64748b' }}>
          {t('resetPasswordTitle')}: <b>{user.full_name}</b> ({user.username})
        </p>

        {tempPassword ? (
          <div>
            <div className="temp-password-box">
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>
                  {t('temporaryPassword')}:
                </small>
                <code style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.05em' }}>
                  {tempPassword}
                </code>
              </div>
              <button type="button" className="secondary" onClick={copyToClipboard}>
                {copied ? '✓' : '📋'}
              </button>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1.25rem' }}>
              ⚠️ {t('mustChangeNextLogin')}
            </p>
            <div className="actions" style={{ justifyContent: 'flex-end' }}>
              <button type="button" onClick={done}>
                {t('actionDone')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              {t('newPassword')} (optional):
              <input
                type="text"
                value={customPassword}
                onChange={e => setCustomPassword(e.target.value)}
                placeholder={t('passwordHint')}
                minLength={4}
              />
            </label>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="secondary" onClick={close} disabled={busy}>
                {t('cancel')}
              </button>
              <button disabled={busy}>
                {busy ? t('loading') : t('resetPassword')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function DeleteUserModal({
  user,
  close,
  confirmDelete,
  busy
}: {
  user: any;
  close: () => void;
  confirmDelete: () => Promise<void>;
  busy: boolean;
}) {
  const { t } = useT();

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 460 }}>
        <h2 style={{ color: '#dc2626' }}>🗑️ {t('delete')}</h2>
        <p style={{ margin: '0.75rem 0', color: '#334155' }}>
          {t('confirmDeleteUser')}
        </p>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: 8, margin: '0.75rem 0' }}>
          <b style={{ color: '#991b1b', display: 'block' }}>{user.full_name} ({user.username})</b>
          <small style={{ color: '#7f1d1d' }}>
            ⚠️ {t('removeManagement')}
          </small>
        </div>
        <div className="actions" style={{ justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="secondary" onClick={close} disabled={busy}>
            {t('cancel')}
          </button>
          <button type="button" className="danger" onClick={confirmDelete} disabled={busy}>
            {busy ? t('loading') : t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
