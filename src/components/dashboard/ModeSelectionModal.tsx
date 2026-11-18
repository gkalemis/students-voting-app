import React from 'react';
import { useT } from '../../context/LocaleContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface Props {
  onChoosePresentationVoting: () => void;
  onChooseQuizPoll: () => void;
  onClose: () => void;
}

export function ModeSelectionModal({
  onChoosePresentationVoting,
  onChooseQuizPoll,
  onClose
}: Props) {
  const { t, language } = useT();
  useEscapeKey(onClose);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
      <div className="card modal-dialog" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '1.25rem', maxWidth: '560px', width: '100%', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>
              🎓 {language === 'el' ? 'Επιλογή Λειτουργίας Συνεδρίας' : 'Select Session Mode'}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              {language === 'el' ? 'Επιλέξτε τον τύπο συνεδρίας που επιθυμείτε να ξεκινήσετε' : 'Choose the type of session you wish to run'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="outline" style={{ border: 'none', fontSize: '1.25rem', padding: '0.2rem 0.6rem' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          {/* Option 1: Presentation Voting */}
          <button
            type="button"
            onClick={onChoosePresentationVoting}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.25rem',
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              border: '2px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#0d9488';
              (e.currentTarget as HTMLElement).style.background = '#f0fdf4';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
              (e.currentTarget as HTMLElement).style.background = '#f8fafc';
            }}
          >
            <span style={{ fontSize: '2.5rem', background: '#e0f2fe', padding: '0.5rem', borderRadius: '0.75rem' }}>
              👥
            </span>
            <div>
              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                {language === 'el' ? 'Αξιολόγηση Παρουσιάσεων Φοιτητών (Voting)' : 'Student Presentation Evaluation (Voting)'}
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.4 }}>
                {language === 'el'
                  ? 'Βαθμολόγηση φοιτητικών παρουσιάσεων ανά κριτήριο (1-5), σειρά παρουσιάσεων, podium κατάταξης και εξαγωγή αποτελεσμάτων CSV/Excel.'
                  : 'Grade student presentations by criteria (1-5), presentation queue, podium rankings, and CSV export.'}
              </p>
            </div>
          </button>

          {/* Option 2: Quiz / Poll */}
          <button
            type="button"
            onClick={onChooseQuizPoll}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.25rem',
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              border: '2px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#2563eb';
              (e.currentTarget as HTMLElement).style.background = '#eff6ff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
              (e.currentTarget as HTMLElement).style.background = '#f8fafc';
            }}
          >
            <span style={{ fontSize: '2.5rem', background: '#dbeafe', padding: '0.5rem', borderRadius: '0.75rem' }}>
              🎯
            </span>
            <div>
              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                {language === 'el' ? 'Quiz / Δημοσκόπηση (Polls & Quizzes)' : 'Quiz / Interactive Polls'}
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.4 }}>
                {language === 'el'
                  ? 'Αυτόνομες ερωτήσεις κλειστού τύπου / Σωστό-Λάθος, ζωντανά ποσοστά με ραβδογράμματα στον προβολέα και στο κινητό (π.χ. 6 ερωτήσεις επιστημονικής μεθόδου).'
                  : 'Closed-ended questions & True/False with live percentage bar charts on projector and mobile screens.'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
