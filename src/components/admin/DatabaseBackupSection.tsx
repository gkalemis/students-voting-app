import React, { useRef, useState } from 'react';
import { api, token } from '../../api';
import { useT } from '../../context/LocaleContext';
import { translateError } from '../../i18n';
import { safeStorage } from '../../utils/storage';

interface Props {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onReload: () => void;
}

export function DatabaseBackupSection({ onSuccess, onError, onReload }: Props) {
  const { t, language } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [busyRestore, setBusyRestore] = useState(false);

  async function handleExport() {
    setBusyExport(true);
    onError('');
    try {
      const headers: Record<string, string> = {};
      if (token()) headers['Authorization'] = `Bearer ${token()}`;
      const r = await fetch('/api/admin/backup', { headers });
      if (!r.ok) {
        let msg = t('backupExportFailed');
        try {
          const data = await r.json();
          if (data?.detail) msg = String(data.detail);
        } catch {}
        throw new Error(msg);
      }
      const blob = await r.blob();
      const dis = r.headers.get('Content-Disposition');
      let filename = `db-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const match = dis?.match(/filename="?([^"]+)"?/);
      if (match?.[1]) filename = match[1];

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      onError(translateError(e, language));
    } finally {
      setBusyExport(false);
    }
  }

  async function handleRestore() {
    if (!selectedFile) return;
    setBusyRestore(true);
    onError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api('/admin/backup/restore', {
        method: 'POST',
        body: formData
      });
      const summary = res?.summary;
      const details = summary
        ? ` (${summary.sessions} ${language === 'el' ? 'συνεδρίες' : 'sessions'}, ${summary.polls} quiz/polls)`
        : '';
      onSuccess(`${t('restoreSuccess')}${details}`);
      setConfirmOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      safeStorage.removeItem('auth_token');
      window.location.assign('/login');
    } catch (e) {
      onError(translateError(e, language));
      setConfirmOpen(false);
    } finally {
      setBusyRestore(false);
    }
  }

  return (
    <section style={{ margin: '2rem 0 1.5rem 0' }}>
      <h2>💾 {t('backupSectionTitle')}</h2>
      <div
        className="card"
        style={{
          borderLeft: '4px solid #0284c7',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem' }}>
          {t('backupSectionDesc')}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="secondary"
            onClick={handleExport}
            disabled={busyExport || busyRestore}
          >
            ⬇️ {busyExport ? t('loading') : t('exportBackupBtn')}
          </button>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              aria-label={t('selectBackupFile')}
              style={{ width: 'auto', maxWidth: '280px', padding: '0.4rem', fontSize: '0.88rem' }}
              onChange={e => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                setConfirmOpen(false);
              }}
            />
            <button
              type="button"
              disabled={!selectedFile || busyRestore || busyExport}
              onClick={() => setConfirmOpen(true)}
            >
              ⬆️ {t('restoreBackupBtn')}
            </button>
          </div>
        </div>

        {confirmOpen && selectedFile && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #f59e0b',
              borderRadius: '0.6rem',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            <strong style={{ color: '#92400e' }}>⚠️ {t('restoreConfirmTitle')}: {selectedFile.name}</strong>
            <p style={{ margin: 0, color: '#78350f', fontSize: '0.9rem' }}>
              {t('restoreConfirmWarning')}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="secondary"
                disabled={busyRestore}
                onClick={() => setConfirmOpen(false)}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="danger"
                disabled={busyRestore}
                onClick={handleRestore}
              >
                {busyRestore ? t('saving') : t('restoreBackupBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
