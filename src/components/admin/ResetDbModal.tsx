import React from 'react';
import { useT } from '../../context/LocaleContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface Props {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetDbModal({ show, onConfirm, onCancel }: Props) {
  const { t } = useT();
  useEscapeKey(onCancel, show);
  if (!show) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, borderLeft: '4px solid #ef4444' }}>
        <h2 style={{ color: '#b91c1c' }}>⚠️ {t('dangerZone')}</h2>
        <p style={{ margin: '.8rem 0', fontSize: '.95rem', color: '#334155' }}>
          {t('confirmResetDatabase')}
        </p>
        <div className="actions" style={{ marginTop: '1.2rem', justifyContent: 'flex-end', gap: '.6rem' }}>
          <button type="button" className="secondary" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            🗑️ {t('resetDatabase')}
          </button>
        </div>
      </div>
    </div>
  );
}
