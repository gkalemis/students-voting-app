import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { BrandHeader } from '../components/BrandHeader';
import { LanguageButton } from '../components/LanguageButton';
import { BrandedLayout } from '../components/BrandedLayout';
import { PresentationHeaderCard } from '../components/PresentationHeaderCard';
import { usePublic } from '../hooks/usePublic';
import { WaitingQueue } from '../components/WaitingQueue';

export function Join() {
  const { publicId = '' } = useParams();
  const { t, language } = useT();
  const [s, load] = usePublic(publicId);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [inputMode, setInputMode] = useState<'numbers' | 'dropdown'>('numbers');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; subtitle?: string } | null>(null);
  const [pt, setPt] = useState('');
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const key = `vote_token_${publicId}`;
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && new Date(saved.expires_at) > new Date()) {
      setPt(saved.token);
    } else {
      localStorage.removeItem(key);
      api(`/public/sessions/${publicId}/tokens`, json('POST'))
        .then(x => {
          localStorage.setItem(key, JSON.stringify(x));
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

  async function submit() {
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

  return (
    <BrandedLayout state={s}>
      <main className="mobile">
        <div className="public-tools"><LanguageButton /></div>
        
        {/* If no presentation is active, show the institution header */}
        {!s.active_presentation && <BrandHeader brand={s.branding} />}

        {s.active_presentation ? (
          <div className="grading-flow">
            {/* Presentation Hero Card: clearly showcases Logo, University, School, Department, Presenter name, and live Timer */}
            <PresentationHeaderCard
              brand={s.branding}
              courseName={s.course}
              periodName={s.period}
              groupTitle={s.group}
              presenterName={s.active_presentation.presenter_name}
              presentationTitle={s.active_presentation.title}
              closesAt={s.active_presentation.closes_at}
              onExpire={load}
            />

            <section className="card grading-section">
              {/* Input mode toggle: colorful numbers 1-5 vs dropdown */}
              <div className="grading-control-bar">
                <b className="grading-categories-heading">{t('gradeCategories')}</b>
                <div className="mode-toggle" role="group" aria-label={t('inputMode')}>
                  <button
                    type="button"
                    className={inputMode === 'numbers' ? 'active' : ''}
                    onClick={() => setInputMode('numbers')}
                  >
                    {t('numbersMode')}
                  </button>
                  <button
                    type="button"
                    className={inputMode === 'dropdown' ? 'active' : ''}
                    onClick={() => setInputMode('dropdown')}
                  >
                    {t('dropdownMode')}
                  </button>
                </div>
              </div>

              {/* Categories */}
              {s.criteria.map((c, idx) => {
                const currentVal = scores[c.id];
                return (
                  <div key={c.id} className={`category-card category-card-${(idx % 4) + 1}`}>
                    <div className="category-header">
                      <h3>{c.name}</h3>
                      <span className="category-weight">{c.weight}%</span>
                    </div>

                    {inputMode === 'numbers' ? (
                      <div className="ratings">
                        {[1, 2, 3, 4, 5].map(n => (
                          <label key={n} className={`rating-btn rating-btn-${n} ${currentVal === n ? 'selected' : ''}`}>
                            <input
                              type="radio"
                              name={`c${c.id}`}
                              checked={currentVal === n}
                              onChange={() => {
                                setScores({ ...scores, [c.id]: n });
                                setIsModified(true);
                              }}
                            />
                            <span className="rating-digit">{n}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <select
                        className="category-select"
                        value={currentVal || ''}
                        onChange={e => {
                          const val = Number(e.target.value);
                          if (val >= 1 && val <= 5) {
                            setScores({ ...scores, [c.id]: val });
                            setIsModified(true);
                          }
                        }}
                      >
                        <option value="">-- {t('selectGrade')} --</option>
                        <option value="1">{t('scorePoor')}</option>
                        <option value="2">{t('scoreFair')}</option>
                        <option value="3">{t('scoreGood')}</option>
                        <option value="4">{t('scoreVeryGood')}</option>
                        <option value="5">{t('scoreExcellent')}</option>
                      </select>
                    )}
                  </div>
                );
              })}

              {/* Progress summary & submit */}
              <div className="progress-summary">
                <span className="progress-counter-text">
                  📊 {gradedCount} / {s.criteria.length} {t('gradesCompleted')}
                </span>
                {allGraded && <span className="progress-complete-badge">✓ {t('actionDone')}</span>}
              </div>

              <button
                className={`submit-btn-large ${isModified ? 'submit-btn-blinking' : ''}`}
                disabled={!pt || !allGraded}
                onClick={submit}
              >
                {t('submitRating')}
              </button>
            </section>
          </div>
        ) : (
          <WaitingQueue s={s} />
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
