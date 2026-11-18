import React from 'react';
import { AcademicLogo } from '../AcademicLogo';
import { LanguageButton } from '../LanguageButton';
import { PollBarChart } from '../polls/PollBarChart';
import { useT } from '../../context/LocaleContext';

interface Props {
  poll: any;
  selectedIndex: number | null;
  onSelectOption: (idx: number) => void;
  hasSubmitted: boolean;
  submitting: boolean;
}

export function MobilePollViewport({
  poll,
  selectedIndex,
  onSelectOption,
  hasSubmitted,
  submitting,
}: Props) {
  const { t, language } = useT();
  const q = poll.active_question;
  const isTF = q?.type === 'TRUE_FALSE';

  return (
    <div className="mobile-voting-viewport" style={{ padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Brand & Language Header */}
      <header className="mobile-voting-brand-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AcademicLogo logoUrl={poll.branding?.logo_url} size={42} title={poll.branding?.university_name?.el || t('app')} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              {poll.branding?.university_name?.[language] || poll.branding?.university_name?.el || t('app')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              🎓 {poll.course_name} {poll.period_name && `· ${poll.period_name}`}
            </div>
          </div>
        </div>
        <LanguageButton />
      </header>

      {/* Main Poll Card */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem', borderRadius: '1rem', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', background: '#eff6ff', padding: '0.3rem 0.75rem', borderRadius: '9999px' }}>
            🎯 {t('quizPoll')}
          </span>
          {q && (
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
              {t('questionNumber').replace('{current}', String(q.position + 1)).replace('{total}', String(poll.total_questions || 1))}
            </span>
          )}
        </div>

        {q ? (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              {q.text}
            </h2>

            {/* Answer Options */}
            {q.status === 'OPEN' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {q.options.map((optText: string, idx: number) => {
                  const isSelected = selectedIndex === idx;
                  const letter = isTF ? (idx === 0 ? '✓' : '✗') : ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ'][idx] || String(idx + 1);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={submitting}
                      onClick={() => onSelectOption(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.25rem',
                        borderRadius: '0.85rem',
                        border: isSelected ? '2.5px solid #2563eb' : '1.5px solid #cbd5e1',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease-in-out',
                        outline: 'none',
                        boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.2)' : 'none'
                      }}
                    >
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          background: isSelected ? '#2563eb' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#475569'
                        }}
                      >
                        {letter}
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1e40af' : '#1e293b', flex: 1 }}>
                        {optText}
                      </span>
                      {isSelected && (
                        <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '1.2rem' }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Status notice */}
            {hasSubmitted && q.status === 'OPEN' && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '0.75rem', color: '#065f46', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✅</span>
                <span>{t('pollAnswerSubmitted')}</span>
              </div>
            )}

            {q.status === 'CLOSED' && !poll.show_results && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '1rem', borderRadius: '0.75rem', color: '#92400e', textAlign: 'center', fontWeight: 600, margin: '1rem 0' }}>
                ⏳ {t('pollQuestionClosed')}
              </div>
            )}

            {/* Results distribution if revealed by lecturer */}
            {poll.show_results && poll.results && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed #e2e8f0' }}>
                <PollBarChart
                  distribution={poll.results.distribution}
                  totalVotes={poll.results.total_votes}
                  correctOptionIndex={q.correct_option_index}
                  questionType={q.type}
                  isProjector={false}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⌛</div>
            <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>{t('waitingNextQuestion')}</h3>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('autoUpdate')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
