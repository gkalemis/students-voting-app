import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { BrandHeader } from '../components/BrandHeader';
import { LanguageButton } from '../components/LanguageButton';
import { BrandedLayout } from '../components/BrandedLayout';
import { VotingCountdown } from '../components/VotingCountdown';
import { usePublic } from '../hooks/usePublic';
import { WaitingQueue } from '../components/WaitingQueue';
import { ResultsPodium } from '../components/ResultsPodium';
import { safeStorage } from '../utils/storage';

export function Join() {
  const { publicId = '' } = useParams();
  const { t, language } = useT();
  const [s, load] = usePublic(publicId);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; subtitle?: string } | null>(null);
  const [pt, setPt] = useState('');
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const key = `vote_token_${publicId}`;
    let saved: any = null;
    try {
      saved = JSON.parse(safeStorage.getItem(key) || 'null');
    } catch {}
    if (saved && new Date(saved.expires_at) > new Date()) {
      setPt(saved.token);
    } else {
      safeStorage.removeItem(key);
      api(`/public/sessions/${publicId}/tokens`, json('POST'))
        .then(x => {
          safeStorage.setItem(key, JSON.stringify(x));
          setPt(x.token);
        })
        .catch(e => setToast({ type: 'error', title: translateError(e, language) }));
    }
  }, [publicId, language]);

  useEffect(() => {
    if (pt && s?.active_presentation) {
      api(`/public/sessions/${publicId}/my-vote`, { headers: { 'X-Participation-Token': pt } })
        .then(x => {
          setScores(Object.fromEntries(Object.entries(x.scores as Record<string, number>).map(([k, v]) => [Number(k), v])) as Record<number, number>);
          setIsModified(false);
        })
        .catch(() => {});
    }
  }, [pt, s?.active_presentation?.id]);

  if (!s) return <main className="center">{t('loading')}</main>;

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if vibration is disabled or unsupported
      }
    }
  };

  const handleScoreChange = (criterionId: number, val: number) => {
    triggerHaptic(15);
    setScores(prev => ({ ...prev, [criterionId]: val }));
    setIsModified(true);
  };

  async function submit() {
    triggerHaptic([40, 30, 40]);

    try {
      await api(`/public/sessions/${publicId}/vote`, {
        ...json('PUT', { scores }),
        headers: { 'X-Participation-Token': pt }
      });
      setToast({
        type: 'success',
        title: language === 'el' ? 'Η ψήφος καταχωρίστηκε!' : 'Vote submitted!',
        subtitle: language === 'el' ? 'Μπορείτε να αλλάξετε όσο η ψηφοφορία είναι ανοικτή' : 'Editable while voting remains open'
      });
      setIsModified(false);
      setTimeout(() => setToast(null), 3200);
      load();
    } catch (e) {
      setToast({
        type: 'error',
        title: translateError(e, language)
      });
      setTimeout(() => setToast(null), 4000);
    }
  }

  const gradedCount = Object.keys(scores).length;
  const allGraded = gradedCount === s.criteria.length;

  const allClosed = Boolean(
    s.presentations &&
    s.presentations.length > 0 &&
    s.presentations.every((p: any) => p.status === 'EVALUATED' || p.status === 'SKIPPED' || p.status === 'NO_VOTES')
  );

  const showResults = Boolean(
    s.results &&
    s.results.length > 0 &&
    !s.active_presentation &&
    (s.results_revealed || s.status === 'COMPLETED' || allClosed)
  );

  return (
    <BrandedLayout state={s}>
      <main className="mobile">
        {s.active_presentation ? (
          /* ========================================================
             SINGLE-SCREEN MOBILE VOTING EXPERIENCE
             ======================================================== */
          <div className="mobile-voting-viewport">
            {/* Ultra-compact sticky top bar with student name and countdown timer */}
            <header className="mobile-compact-topbar">
              <div className="mobile-compact-left">
                <span className="mobile-compact-avatar" aria-hidden="true">👤</span>
                <div className="mobile-compact-info">
                  <h2 className="mobile-compact-name">{s.active_presentation.presenter_name}</h2>
                  {s.active_presentation.title && (
                    <span className="mobile-compact-title" title={s.active_presentation.title}>
                      {s.active_presentation.title}
                    </span>
                  )}
                </div>
              </div>
              <div className="mobile-compact-right">
                <VotingCountdown
                  closesAt={s.active_presentation.closes_at}
                  onExpire={load}
                  isCompact={true}
                />
                <LanguageButton />
              </div>
            </header>

            {/* Dense evaluation criteria (fits on one screen) */}
            <div className="mobile-compact-body">
              {s.criteria.map((c) => {
                const currentVal = scores[c.id];
                return (
                  <div key={c.id} className="mobile-compact-criterion">
                    <div className="mobile-criterion-header">
                      <span className="mobile-criterion-name">{c.name}</span>
                      <span className="mobile-criterion-weight">{c.weight}%</span>
                    </div>

                    <div className="mobile-rating-buttons" role="radiogroup" aria-label={c.name}>
                      {[1, 2, 3, 4, 5].map(n => {
                        const isSelected = currentVal === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`mobile-rating-btn rating-val-${n} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleScoreChange(c.id, n)}
                          >
                            <span className="rating-digit">{n}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact bottom bar with progress status and high-visibility submit */}
            <footer className="mobile-compact-footer">
              <div className="mobile-footer-status">
                <span className="mobile-progress-text">
                  📊 {gradedCount}/{s.criteria.length} {t('gradesCompleted')}
                </span>
                {allGraded && <span className="mobile-progress-badge">✓ {t('actionDone')}</span>}
              </div>

              <button
                type="button"
                className={`mobile-submit-btn ${!allGraded || !pt ? 'disabled' : ''} ${isModified ? 'pulse' : ''}`}
                disabled={!pt || !allGraded}
                onClick={submit}
              >
                {t('submitRating')}
              </button>
            </footer>
          </div>
        ) : showResults ? (
          /* ========================================================
             FINAL RESULTS PODIUM (SHOWN AUTOMATICALLY ON CLOSE/COMPLETE)
             ======================================================== */
          <div className="mobile-results-container">
            <div className="public-tools" style={{ marginBottom: '0.75rem' }}>
              <LanguageButton />
            </div>
            <BrandHeader brand={s.branding} />
            <ResultsPodium rows={s.results} isProjector={false} />
          </div>
        ) : (
          /* ========================================================
             IDLE / WAITING FOR NEXT PRESENTATION
             ======================================================== */
          <div className="mobile-idle-container">
            <div className="public-tools" style={{ marginBottom: '0.75rem' }}>
              <LanguageButton />
            </div>
            <BrandHeader brand={s.branding} />
            <WaitingQueue s={s} />
          </div>
        )}

        {toast && (
          <div
            className={`vote-toast-compact ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
            role="status"
            onClick={() => setToast(null)}
            title="Click to dismiss"
          >
            <span className="toast-icon" aria-hidden="true">
              {toast.type === 'error' ? '⚠️' : '✓'}
            </span>
            <div className="toast-text-box">
              <strong className="toast-title">{toast.title}</strong>
              {toast.subtitle && <span className="toast-subtitle">{toast.subtitle}</span>}
            </div>
            <button
              type="button"
              className="toast-close-btn"
              aria-label="Dismiss"
              onClick={e => {
                e.stopPropagation();
                setToast(null);
              }}
            >
              ✕
            </button>
          </div>
        )}
      </main>
    </BrandedLayout>
  );
}
