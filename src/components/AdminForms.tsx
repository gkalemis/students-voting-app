import React, { useState } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';

export function UserForm({
  close, saved, failed
}: {
  close: () => void;
  saved: () => void;
  failed: (e: unknown) => void;
}) {
  const { t } = useT();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/users', json('POST', {
        username,
        full_name: fullName,
        password,
        role: 'LECTURER'
      }));
      saved();
    } catch (e) {
      failed(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal">
      <form className="card" onSubmit={submit}>
        <h2>{t('addLecturer')}</h2>
        <label>
          {t('username')}
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            minLength={3}
            maxLength={100}
            pattern="[A-Za-z0-9_.-]+"
            required
            autoFocus
          />
          <small>{t('usernameHint')}</small>
        </label>
        <label>
          {t('fullName')}
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            maxLength={200}
            required
          />
        </label>
        <label>
          {t('temporaryPassword')}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={5}
            maxLength={200}
            required
          />
          <small>{t('passwordHint')}</small>
        </label>
        <div className="actions">
          <button disabled={busy}>{t('create')}</button>
          <button type="button" className="secondary" onClick={close}>{t('cancel')}</button>
        </div>
      </form>
    </div>
  );
}

export function LogoUpload({
  saved, failed
}: {
  saved: (brand: any) => void;
  failed: (e: unknown) => void;
}) {
  const { t } = useT();
  const [file, setFile] = useState<File>();

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    try {
      saved(await api('/branding/logo', { method: 'POST', body }));
    } catch (e) {
      failed(e);
    }
  }

  return (
    <form className="card" onSubmit={upload}>
      <label>
        {t('logo')}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={e => setFile(e.target.files?.[0])}
          required
        />
      </label>
      <button>{t('uploadLogo')}</button>
    </form>
  );
}




