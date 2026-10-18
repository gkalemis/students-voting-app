import React from 'react';
import { State } from '../types';
import { useT } from '../context/LocaleContext';
import { translateStatus } from '../i18n';
import { toGreekUppercase } from '../utils/greek';

export function WaitingQueue({ s }: { s: State }) {
  const { t } = useT();

  const isCompleted = s.status === 'COMPLETED';
  const presentations = s.presentations || [];
  const pendingPresentations = presentations.filter(p => p.status === 'PENDING');
  const allClosed = Boolean(
    presentations.length > 0 &&
    presentations.every(p => p.status === 'EVALUATED' || p.status === 'SKIPPED' || p.status === 'NO_VOTES')
  );

  return (
    <section className="card" style={{ marginTop: '0.75rem', textAlign: 'center', padding: '1rem 0.85rem', borderRadius: 14, borderTop: '4px solid var(--accent)' }}>
      <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: 'var(--accent)' }}>
        {isCompleted ? '🏁' : allClosed ? '🎉' : '⏳'}
      </div>
      <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>
        {isCompleted
          ? t('sessionCompleted')
          : allClosed
          ? t('waitingLecturerToEndSession')
          : t('waitingPresentation')}
      </h2>
      <p style={{ color: '#475569', fontSize: '0.82rem', maxWidth: '380px', margin: '0 auto 0.65rem auto', lineHeight: 1.4 }}>
        {isCompleted ? t('sessionCompleted') : t('autoUpdate')}
      </p>

      {presentations.length > 0 && (
        <div style={{ textAlign: 'left', marginTop: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <b style={{ fontSize: '0.82rem', color: '#1e293b' }}>{t('presentations')}</b>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>
              {pendingPresentations.length} {t('pending')}
            </span>
          </div>

          <div
            className="student-waiting-scroll-list"
            style={{
              maxHeight: 'min(62vh, 520px)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              paddingRight: '0.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem'
            }}
          >
            {presentations.map((p, idx) => {
              const isOpen = p.status === 'VOTING_OPEN';
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.36rem 0.6rem',
                    borderRadius: '8px',
                    background: isOpen ? 'color-mix(in srgb, var(--accent) 12%, #ffffff)' : '#f8fafc',
                    border: '1.5px solid',
                    borderColor: isOpen ? 'var(--accent)' : '#e2e8f0',
                    boxShadow: isOpen ? '0 2px 6px color-mix(in srgb, var(--accent) 20%, transparent)' : 'none'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.80rem',
                        color: '#0f172a',
                        lineHeight: 1.25,
                        wordBreak: 'break-word'
                      }}
                    >
                      {idx + 1}. {p.presenter_name}
                    </div>
                    {p.title && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px', lineHeight: 1.2 }}>
                        {p.title}
                      </div>
                    )}
                  </div>
                  <span
                    className={`pill ${p.status.toLowerCase()}`}
                    lang="el"
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.42rem',
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                      marginLeft: '0.4rem',
                      flexShrink: 0
                    }}
                  >
                    {toGreekUppercase(translateStatus(p.status, t))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
