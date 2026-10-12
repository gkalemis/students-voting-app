import React from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  target: any;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StudentDeleteModal({ target, busy, onConfirm, onCancel }: Props) {
  const { t } = useT();
  if (!target) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 440 }}>
        <h2>🗑️ {t('confirmDelete')}</h2>
        <p style={{ margin: '.8rem 0' }}>
          <b>{target.full_name}</b> {target.presentation_title ? `(«${target.presentation_title}»)` : ''}
        </p>
        <div className="actions" style={{ marginTop: '1.2rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {t('cancel')}
          </button>
          <button
            className="danger"
            disabled={busy}
            onClick={onConfirm}
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
