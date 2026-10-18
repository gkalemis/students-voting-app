import React, { useState, useEffect } from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  show: boolean;
  onReveal: () => Promise<void>;
}

export function ArchivePromptModal({ show, onReveal }: Props) {
  const { t, language } = useT();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) setLoading(false);
  }, [show]);

  if (!show) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 480, padding: '1.75rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.4rem' }}>🎉</div>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>{t('archivePromptTitle')}</h2>
        <p style={{ fontSize: '.95rem', color: '#334155', lineHeight: 1.5, margin: '0.75rem 0 1.5rem 0' }}>
          {language === 'el'
            ? 'Η ψηφοφορία ολοκληρώθηκε! Πατήστε παρακάτω για την άμεση προβολή των τελικών αποτελεσμάτων.'
            : 'Voting has concluded! Click below to immediately view the final results.'}
        </p>
        <button
          type="button"
          className="primary"
          onClick={async () => {
            setLoading(true);
            try { await onReveal(); } finally { setLoading(false); }
          }}
          disabled={loading}
          style={{ width: '100%', padding: '.85rem 1rem', fontSize: '1.05rem', fontWeight: 700 }}
        >
          {loading ? '⏳' : '👁️'} {language === 'el' ? (loading ? 'Φόρτωση...' : 'Εμφάνιση αποτελεσμάτων') : (loading ? 'Loading...' : 'Show results')}
        </button>
      </div>
    </div>
  );
}
