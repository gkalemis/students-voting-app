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

  return (
    <section className="card" style={{ marginTop: '1.25rem', textAlign: 'center', padding: '2rem 1.25rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
        {isCompleted ? '🏁' : '⏳'}
      </div>
      <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: '#0f172a' }}>
        {isCompleted ? t('sessionCompleted') : t('waitingPresentation')}
      </h2>
      <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>
        {isCompleted
          ? t('sessionCompleted')
          : t('autoUpdate')}
      </p>

      {presentations.length > 0 && (
        <div style={{ textAlign: 'left', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <b style={{ fontSize: '0.9rem', color: '#1e293b' }}>{t('presentations')}</b>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {pendingPresentations.length} {t('pending')}
            </span>
          </div>

          <div className="list" style={{ gap: '0.5rem' }}>
            {presentations.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: p.status === 'VOTING_OPEN' ? '#fef2f2' : '#f8fafc',
                  border: '1px solid',
                  borderColor: p.status === 'VOTING_OPEN' ? '#fecaca' : '#e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontWeight: 650, fontSize: '0.92rem', color: '#0f172a' }}>
                    {idx + 1}. {p.presenter_name}
                  </div>
                  {p.title && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {p.title}
                    </div>
                  )}
                </div>
                <span className={`pill ${p.status.toLowerCase()}`} lang="el">
                  {toGreekUppercase(translateStatus(p.status, t))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
