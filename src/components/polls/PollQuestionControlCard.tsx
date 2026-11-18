import React from 'react';
import { useT } from '../../context/LocaleContext';
import { PollBarChart } from './PollBarChart';

interface Props {
  questions: any[];
  selectedQuestion: any;
  selectedIdx: number;
  liveQuestionId: number | null;
  showResults: boolean;
  actionBusy: boolean;
  onSelectIndex: (idx: number) => void;
  onControl: (action: string, questionId?: number) => void;
}

export function PollQuestionControlCard({
  questions,
  selectedQuestion,
  selectedIdx,
  liveQuestionId,
  showResults,
  actionBusy,
  onSelectIndex,
  onControl,
}: Props) {
  const { t, language } = useT();

  if (!selectedQuestion) {
    return (
      <div className="card" style={{ padding: '1.5rem', borderRadius: '1rem', background: '#ffffff' }}>
        <p>{t('noQuestionsFound')}</p>
      </div>
    );
  }

  const isLive = selectedQuestion.id === liveQuestionId;
  const isOpen = selectedQuestion.status === 'OPEN';
  const isSkipped = selectedQuestion.status === 'SKIPPED';

  return (
    <div className="card" style={{ padding: '1.5rem', borderRadius: '1rem', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: 9999 }}>
            {t('questionNumber').replace('{current}', String(selectedIdx + 1)).replace('{total}', String(questions.length))}
          </span>
          {isLive ? (
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065f46', background: '#d1fae5', padding: '0.25rem 0.65rem', borderRadius: 9999 }}>
              🟢 {t('projectingNow')}
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: 9999 }}>
              👁️ {t('previewOnly')}
            </span>
          )}
        </div>

        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isOpen ? '#10b981' : isSkipped ? '#dc2626' : '#f59e0b' }}>
          ● {isOpen ? t('votingOpen') : isSkipped ? t('skipped') : t('pollQuestionClosed')}
        </span>
      </div>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', lineHeight: 1.35 }}>
        {selectedQuestion.text}
      </h2>

      {isSkipped && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.65rem 0.9rem', borderRadius: '0.6rem', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1rem' }}>
          ⏭️ {t('questionSkippedNotice')}
        </div>
      )}

      {/* Action buttons for lecturer */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {!isSkipped && (!isLive || !isOpen) && (
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => onControl('open_question', selectedQuestion.id)}
            style={{ background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700 }}
          >
            ▶️ {t('showAndOpenQuestion')}
          </button>
        )}

        {isLive && isOpen && (
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => onControl('close_question')}
            style={{ background: '#f59e0b', color: '#ffffff', border: 'none', fontWeight: 700 }}
          >
            ⏹️ {t('closeQuestion')}
          </button>
        )}

        {isLive && (
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => onControl(showResults ? 'hide_results' : 'show_results')}
              className="outline"
              style={{ fontWeight: 700, borderColor: showResults ? '#94a3b8' : '#2563eb', color: showResults ? '#475569' : '#2563eb' }}
            >
              {showResults ? `🙈 ${t('hideResults')}` : `📊 ${t('showResults')}`}
            </button>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => onControl('standby')}
              className="outline"
              style={{ fontWeight: 700, borderColor: '#64748b', color: '#334155' }}
            >
              ⏸️ {t('hideFromProjector')}
            </button>
          </>
        )}

        {isSkipped ? (
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => onControl('restore_question', selectedQuestion.id)}
            className="outline"
            style={{ fontWeight: 700, borderColor: '#0284c7', color: '#0284c7' }}
          >
            ↩️ {t('restoreQuestion')}
          </button>
        ) : (
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => onControl('skip_question', selectedQuestion.id)}
            className="outline"
            style={{ fontWeight: 600, borderColor: '#f87171', color: '#dc2626' }}
          >
            ⏭️ {t('skipQuestion')}
          </button>
        )}

        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          {selectedIdx > 0 && (
            <button
              type="button"
              onClick={() => onSelectIndex(selectedIdx - 1)}
              className="outline"
              style={{ fontWeight: 600 }}
              title={language === 'el' ? 'Προεπισκόπηση προηγούμενης' : 'Preview previous'}
            >
              ⏮️ {language === 'el' ? 'Προηγούμενη' : 'Prev'}
            </button>
          )}
          {selectedIdx < questions.length - 1 && (
            <button
              type="button"
              onClick={() => onSelectIndex(selectedIdx + 1)}
              className="outline"
              style={{ fontWeight: 600 }}
              title={language === 'el' ? 'Προεπισκόπηση επόμενης' : 'Preview next'}
            >
              ⏭️ {language === 'el' ? 'Επόμενη' : 'Next'}
            </button>
          )}
        </div>
      </div>

      {/* Individual question distribution bar chart */}
      <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
        <PollBarChart
          distribution={selectedQuestion.results?.distribution || []}
          totalVotes={selectedQuestion.results?.total_votes || 0}
          correctOptionIndex={selectedQuestion.correct_option_index}
          questionType={selectedQuestion.type}
          isProjector={false}
        />
      </div>
    </div>
  );
}
