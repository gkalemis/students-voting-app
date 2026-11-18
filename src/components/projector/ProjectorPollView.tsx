import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BrandHeader } from '../BrandHeader';
import { LanguageButton } from '../LanguageButton';
import { AppFooter } from '../AppFooter';
import { PollBarChart } from '../polls/PollBarChart';
import { PollVerticalChart } from '../polls/PollVerticalChart';
import { useT } from '../../context/LocaleContext';

interface Props {
  poll: any;
  fullJoinUrl: string;
}

export function ProjectorPollView({ poll, fullJoinUrl }: Props) {
  const { t } = useT();
  const [chartMode, setChartMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const q = poll.active_question;
  const isTF = q?.type === 'TRUE_FALSE';
  const showResults = Boolean(poll.show_results && poll.results);

  return (
    <main className="projector" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b132b', color: '#f8fafc', padding: '1.5rem' }}>
      <div className="public-tools" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <LanguageButton />
      </div>

      <div className="project-grid" style={{ flex: 1 }}>
        {/* Main projection stage */}
        <section className="projector-main-content" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card projector-idle-card" style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '1.25rem', padding: '2rem', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <BrandHeader brand={poll.branding} isProjector={true} />

            <div className="projector-context-pill" style={{ display: 'flex', gap: '0.75rem', margin: '1rem 0 1.5rem 0', flexWrap: 'wrap' }}>
              <span className="pres-badge course-badge projector-badge" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
                🎓 {poll.course_name}
              </span>
              {poll.period_name && (
                <span className="pres-badge school-badge projector-badge" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
                  🏛️ {poll.period_name}
                </span>
              )}
              <span className="pres-badge dept-badge projector-badge" style={{ fontSize: '1rem', padding: '0.4rem 1rem', background: '#3b82f6', color: '#fff' }}>
                🎯 {poll.title}
              </span>
            </div>

            {q ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: '#2563eb', color: '#ffffff', fontWeight: 800, padding: '0.25rem 0.85rem', borderRadius: 9999, fontSize: '0.95rem' }}>
                      {t('questionNumber').replace('{current}', String(q.position + 1)).replace('{total}', String(poll.total_questions || 1))}
                    </span>
                    <span style={{ color: q.status === 'OPEN' ? '#10b981' : '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>
                      ● {q.status === 'OPEN' ? t('votingOpen') : t('pollQuestionClosed')}
                    </span>
                  </div>

                  {showResults && (
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '0.5rem', gap: '0.2rem' }}>
                      <button
                        onClick={() => setChartMode('horizontal')}
                        style={{
                          background: chartMode === 'horizontal' ? '#2563eb' : 'transparent',
                          color: chartMode === 'horizontal' ? '#fff' : '#475569',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.35rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        📊 Οριζόντιες
                      </button>
                      <button
                        onClick={() => setChartMode('vertical')}
                        style={{
                          background: chartMode === 'vertical' ? '#2563eb' : 'transparent',
                          color: chartMode === 'vertical' ? '#fff' : '#475569',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.35rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        📈 Κάθετες
                      </button>
                    </div>
                  )}
                </div>

                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35, marginBottom: '1.5rem', textAlign: 'left' }}>
                  {q.text}
                </h1>

                {showResults ? (
                  <div style={{ background: '#ffffff', borderRadius: '1rem', padding: '0.5rem 0', color: '#0f172a' }}>
                    {chartMode === 'horizontal' ? (
                      <PollBarChart
                        distribution={poll.results.distribution}
                        totalVotes={poll.results.total_votes}
                        correctOptionIndex={q.correct_option_index}
                        questionType={q.type}
                        isProjector={true}
                      />
                    ) : (
                      <PollVerticalChart
                        distribution={poll.results.distribution}
                        totalVotes={poll.results.total_votes}
                        correctOptionIndex={q.correct_option_index}
                        questionType={q.type}
                        isProjector={true}
                      />
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', width: '100%' }}>
                    {q.options.map((optText: string, idx: number) => {
                      const letter = isTF ? (idx === 0 ? '✓' : '✗') : ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η'][idx] || String(idx + 1);
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            padding: '0.95rem 1.2rem',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            color: '#1e293b',
                            textAlign: 'left'
                          }}
                        >
                          <span
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: '#334155',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {letter}
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                            {optText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#475569' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '0.5rem' }}>{t('waitingNextQuestion')}</h2>
                <p style={{ fontSize: '1.1rem', color: '#64748b' }}>{t('autoUpdate')}</p>
              </div>
            )}
          </div>
        </section>

        {/* QR Code and Instructions Sidebar */}
        <aside className="qr projector-qr-panel" style={{ background: '#1c2541', border: '1px solid #3a506b', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 800 }}>{t('qrCodeSession')}</h3>
          <div className="qr-wrapper" style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '1rem', margin: '0.75rem 0' }}>
            <QRCodeSVG value={fullJoinUrl} size={240} marginSize={2} />
          </div>
          <p className="projector-qr-instruction" style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: '0.5rem 0' }}>
            📱 {t('scanToGrade')}
          </p>
          <p style={{ wordBreak: 'break-all', fontWeight: 700, margin: '0.5rem 0', color: '#60a5fa', fontSize: '0.85rem' }}>
            {fullJoinUrl}
          </p>
        </aside>
      </div>

      <AppFooter className="app-footer-projector" />
    </main>
  );
}
