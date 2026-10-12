import React from 'react';
import { useT } from '../../context/LocaleContext';

interface SessionDeleteProps {
  show: boolean;
  sessionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteSessionModal({ show, sessionTitle, onConfirm, onCancel }: SessionDeleteProps) {
  const { t } = useT();
  if (!show) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 440, padding: '1.5rem' }}>
        <h2>{t('confirmDelete')}</h2>
        <p style={{ margin: '.8rem 0', fontSize: '.95rem', color: '#475569' }}>
          {t('confirmDeleteSession')}
          <br />
          <b style={{ color: '#0f172a' }}>{sessionTitle}</b>
        </p>
        <div className="actions" style={{ marginTop: '1.2rem' }}>
          <button type="button" className="danger" onClick={onConfirm}>
            {t('delete')}
          </button>
          <button type="button" className="secondary" onClick={onCancel}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PresDeleteProps {
  item: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePresenterModal({ item, onConfirm, onCancel }: PresDeleteProps) {
  const { t } = useT();
  if (!item) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 440, padding: '1.5rem' }}>
        <h2>{t('confirmDelete')}</h2>
        <p style={{ margin: '.8rem 0', fontSize: '.95rem', color: '#475569' }}>
          {t('confirmRemovePresenter')}
          <br />
          <b style={{ color: '#0f172a' }}>{item.presenter_name}</b>
          {item.title && <span style={{ color: '#64748b' }}> — {item.title}</span>}
        </p>
        <div className="actions" style={{ marginTop: '1.2rem' }}>
          <button type="button" className="danger" onClick={onConfirm}>
            {t('removePresenter')}
          </button>
          <button type="button" className="secondary" onClick={onCancel}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
