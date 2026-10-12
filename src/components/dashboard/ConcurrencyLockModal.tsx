import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../context/LocaleContext';

interface Props {
  lock: any;
  onClose: () => void;
}

export function ConcurrencyLockModal({ lock, onClose }: Props) {
  const { t, language } = useT();
  if (!lock) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 480, padding: '1.5rem', borderLeft: '5px solid #ef4444' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.8rem' }}>
          <span style={{ fontSize: '1.8rem' }}>⛔</span>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {language === 'el' ? 'Μη εφικτή ενεργοποίηση συνεδρίας' : 'Cannot activate session'}
          </h2>
        </div>
        <p style={{ fontSize: '.95rem', color: '#334155', lineHeight: 1.5, margin: '.6rem 0' }}>
          {lock.detail || t('activeSessionLockWarning')}
        </p>
        {lock.open_session_title && (
          <div style={{ background: '#fef2f2', padding: '.6rem .8rem', borderRadius: 6, margin: '.8rem 0', fontWeight: 600, color: '#991b1b' }}>
            📌 {lock.open_session_title}
          </div>
        )}
        <div className="actions" style={{ marginTop: '1.2rem', justifyContent: 'flex-end', gap: '.6rem' }}>
          {lock.open_session_id && (
            <Link
              to={`/session/${lock.open_session_id}`}
              className="button primary"
              onClick={onClose}
            >
              🚀 {t('goToOpenSession')}
            </Link>
          )}
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
