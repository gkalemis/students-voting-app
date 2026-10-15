import React from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  target: { path: string; label: string; type: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DashboardDeleteModal({ target, onConfirm, onCancel }: Props) {
  const { t, language } = useT();
  if (!target) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 440, padding: '1.5rem' }}>
        <h2>{t('confirmDelete')}</h2>
        <p style={{ margin: '.8rem 0', fontSize: '.95rem', color: '#475569' }}>
          {language === 'el' ? 'Είστε σίγουροι ότι θέλετε να διαγράψετε το στοιχείο: ' : 'Are you sure you want to delete: '}
          <br />
          <b style={{ color: '#0f172a' }}>{target.label}</b> ({target.type})
        </p>
        {target.type === t('group') && (
          <p style={{ color: '#b91c1c', fontSize: '0.84rem', fontWeight: 650, background: '#fef2f2', border: '1px solid #fecaca', padding: '0.45rem 0.65rem', borderRadius: 6, margin: '0.6rem 0' }}>
            ⚠️ {t('deleteGroupCascadeNotice')}
          </p>
        )}
        <div className="actions" style={{ marginTop: '1.2rem' }}>
          <button
            type="button"
            className="danger"
            onClick={onConfirm}
          >
            {t('delete')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
