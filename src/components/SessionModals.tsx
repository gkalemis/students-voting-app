import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useT } from '../context/LocaleContext';
import { token } from '../api';

export function SessionQrCard({
  fullJoinUrl,
  copied,
  copyUrl,
  showQrModal
}: {
  fullJoinUrl: string;
  copied: boolean;
  copyUrl: () => void;
  showQrModal: () => void;
}) {
  const { t } = useT();

  return (
    <div className="card row" style={{ background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div
          onClick={showQrModal}
          style={{ cursor: 'pointer', background: '#fff', padding: '0.4rem', borderRadius: 8, border: '1px solid #cbd5e1' }}
          title={t('showQrCode')}
        >
          <QRCodeSVG value={fullJoinUrl} size={64} />
        </div>
        <div>
          <b style={{ fontSize: '1rem', color: '#1e3a8a' }}>📲 {t('participationLink')}</b>
          <div style={{ color: '#2563eb', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.9rem', marginTop: '2px' }}>
            {fullJoinUrl}
          </div>
        </div>
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={copyUrl}>
          {copied ? `✓ ${t('linkCopied')}` : `📋 ${t('copyLink')}`}
        </button>
        <button type="button" onClick={showQrModal}>
          🔍 {t('showQrCode')}
        </button>
      </div>
    </div>
  );
}

export function QrModal({
  fullJoinUrl,
  copied,
  copyUrl,
  close
}: {
  fullJoinUrl: string;
  copied: boolean;
  copyUrl: () => void;
  close: () => void;
}) {
  const { t } = useT();

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 440 }}>
        <h2>📱 {t('qrCodeSession')}</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {t('scanToGrade')}
        </p>

        <div className="qr-wrapper" style={{ margin: '1rem auto' }}>
          <QRCodeSVG value={fullJoinUrl} size={260} marginSize={2} />
        </div>

        <p style={{ wordBreak: 'break-all', fontWeight: 700, color: '#1d4ed8', margin: '0.75rem 0' }}>
          {fullJoinUrl}
        </p>

        <div className="actions" style={{ justifyContent: 'center', marginTop: '1.25rem' }}>
          <button type="button" className="secondary" onClick={copyUrl}>
            {copied ? `✓ ${t('linkCopied')}` : `📋 ${t('copyLink')}`}
          </button>
          <button type="button" onClick={close}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditModal({
  item,
  save,
  close
}: {
  item: any;
  save: (data: { presenter_name: string; title: string }) => Promise<void>;
  close: () => void;
}) {
  const { t } = useT();
  const [presenterName, setPresenterName] = useState(item.presenter_name || '');
  const [title, setTitle] = useState(item.title || '');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ presenter_name: presenterName, title });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <form className="card" onSubmit={handleSubmit}>
        <h2>{t('edit')}</h2>
        <label>
          {t('presenter')}
          <input
            value={presenterName}
            onChange={e => setPresenterName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          {t('presentationSubject')}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </label>
        <div className="actions" style={{ marginTop: '1rem' }}>
          <button disabled={busy}>{t('save')}</button>
          <button type="button" className="secondary" onClick={close}>
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CompleteModal({
  confirmComplete,
  close
}: {
  confirmComplete: () => void;
  close: () => void;
}) {
  const { t } = useT();

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 460 }}>
        <h2 style={{ color: '#dc2626' }}>⚠️ {t('complete')}</h2>
        <p style={{ margin: '0.75rem 0', color: '#475569' }}>
          {t('confirmComplete')}
        </p>
        <div className="actions" style={{ justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="secondary" onClick={close}>
            {t('cancel')}
          </button>
          <button type="button" className="danger" onClick={confirmComplete}>
            {t('complete')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentDemoModal({
  publicId,
  close
}: {
  publicId: string;
  close: () => void;
}) {
  const { t } = useT();
  const demoUrl = `${window.location.origin}/join/${publicId}`;

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="student-demo-modal-dialog" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="demo-badge">LIVE DEMO</span>
            <b style={{ color: '#0f172a' }}>{t('studentVoteDemo')}</b>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={close}
            style={{ padding: '0.2rem 0.5rem', minHeight: 'auto', borderRadius: '6px' }}
          >
            ✕
          </button>
        </div>

        <div className="student-phone-mockup-wrapper">
          <div className="student-phone-mockup">
            <div className="phone-screen-speaker" />
            <iframe
              src={demoUrl}
              title="Student Vote Demo"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <small style={{ color: '#64748b' }}>
            {t('studentVoteDemoHint')}
          </small>
        </div>
      </div>
    </div>
  );
}

export async function downloadAuth(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const href = e.currentTarget.href;
  const filename = href.split('/').pop() || 'export';
  try {
    const res = await fetch(href, {
      headers: {
        Authorization: `Bearer ${token()}`
      }
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Export download error:', err);
  }
}
