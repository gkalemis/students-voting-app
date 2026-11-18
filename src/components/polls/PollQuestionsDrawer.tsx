import React from 'react';
import { useT } from '../../context/LocaleContext';
import { translateStatus } from '../../i18n';

interface Props {
  questions: any[];
  selectedQuestionId: number | null;
  liveQuestionId: number | null;
  actionBusy: boolean;
  onPreviewQuestion: (questionId: number) => void;
  onControl: (action: string, questionId: number) => void;
  onOpenEdit: () => void;
}

export function PollQuestionsDrawer({
  questions,
  selectedQuestionId,
  liveQuestionId,
  actionBusy,
  onPreviewQuestion,
  onControl,
  onOpenEdit
}: Props) {
  const { t, language } = useT();

  return (
    <div className="card" style={{ padding: '1.25rem', borderRadius: '1rem', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
          📑 {t('questions')} ({questions.length})
        </h3>
        <button
          type="button"
          onClick={onOpenEdit}
          className="outline"
          style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem', color: '#2563eb', borderColor: '#bfdbfe' }}
          title={language === 'el' ? 'Διαμόρφωση ερωτήσεων' : 'Configure questions'}
        >
          ✏️ {language === 'el' ? 'Διαμόρφωση' : 'Edit'}
        </button>
      </div>

      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.76rem', color: '#64748b' }}>
        {language === 'el'
          ? 'Κλικ = Προεπισκόπηση · ▶️ = Προβολή · ⏭️ = Παράλειψη'
          : 'Click = Preview · ▶️ = Show · ⏭️ = Skip'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '62vh', overflowY: 'auto' }}>
        {questions.map((q, idx) => {
          const isPreview = q.id === selectedQuestionId;
          const isLive = q.id === liveQuestionId;
          const isSkipped = q.status === 'SKIPPED';
          const statusBg = isLive ? '#dcfce7' : isSkipped ? '#fee2e2' : '#f1f5f9';
          const statusColor = isLive ? '#166534' : isSkipped ? '#991b1b' : '#64748b';

          return (
            <div
              key={q.id}
              onClick={() => onPreviewQuestion(q.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreviewQuestion(q.id); } }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.55rem',
                cursor: 'pointer',
                border: isLive ? '2px solid #10b981' : isPreview ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: isLive ? '#ecfdf5' : isPreview ? '#eff6ff' : isSkipped ? '#fafafa' : '#ffffff',
                opacity: isSkipped ? 0.68 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  <span style={{ fontWeight: 800, marginRight: '0.35rem', color: isSkipped ? '#94a3b8' : '#2563eb' }}>#{idx + 1}</span>
                  <span style={{ fontSize: '0.86rem', color: '#1e293b', textDecoration: isSkipped ? 'line-through' : 'none' }}>{q.text}</span>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.42rem', borderRadius: 9999, fontWeight: 700, background: statusBg, color: statusColor, flexShrink: 0 }}>
                  {isLive ? t('live') : translateStatus(q.status, t)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                {!isSkipped && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => onControl(isLive ? 'standby' : 'open_question', q.id)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: '0.35rem',
                      border: 'none',
                      cursor: 'pointer',
                      background: isLive ? '#64748b' : '#10b981',
                      color: '#ffffff',
                      width: 'auto'
                    }}
                  >
                    {isLive
                      ? `⏸️ ${language === 'el' ? 'Απόσυρση' : 'Hide'}`
                      : `▶️ ${language === 'el' ? 'Προβολή' : 'Show'}`}
                  </button>
                )}
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => onControl(isSkipped ? 'restore_question' : 'skip_question', q.id)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    borderRadius: '0.35rem',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    background: '#ffffff',
                    color: isSkipped ? '#0284c7' : '#dc2626',
                    width: 'auto'
                  }}
                >
                  {isSkipped ? `↩️ ${t('restoreQuestion')}` : `⏭️ ${t('skipQuestion')}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
