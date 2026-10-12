import React from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  show: boolean;
  archiving: boolean;
  onArchive: () => void;
  onDismiss: () => void;
}

export function ArchivePromptModal({ show, archiving, onArchive, onDismiss }: Props) {
  const { t } = useT();
  if (!show) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 480, padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.4rem' }}>🎉</div>
          <h2 style={{ margin: 0 }}>{t('archivePromptTitle')}</h2>
        </div>
        <p style={{ fontSize: '.95rem', color: '#334155', lineHeight: 1.5, margin: '.75rem 0 1.25rem 0' }}>
          {t('archivePromptDesc')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          <button
            type="button"
            className="primary"
            disabled={archiving}
            onClick={onArchive}
            style={{ padding: '.8rem 1rem', fontSize: '1rem' }}
          >
            📦 {archiving ? '...' : t('archiveSessionNow')}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={archiving}
            onClick={onDismiss}
          >
            👁️ {t('reviewResultsFirst')}
          </button>
        </div>
      </div>
    </div>
  );
}
