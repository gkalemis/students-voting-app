import React from 'react';
import { State } from '../../types';
import { AcademicLogo } from '../AcademicLogo';
import { LanguageButton } from '../LanguageButton';
import { VotingCountdown } from '../VotingCountdown';
import { toGreekUppercase } from '../../utils/greek';

interface MobileVotingViewportProps {
  s: State;
  universityName: string;
  schoolName?: string;
  scores: Record<number, number>;
  onScoreChange: (criterionId: number, val: number) => void;
  allGraded: boolean;
  gradedCount: number;
  pt: string;
  isModified: boolean;
  hasSubmitted: boolean;
  onSubmit: () => void;
  onExpire: () => void;
  language: string;
  t: (key: any) => string;
}

export function MobileVotingViewport({
  s,
  universityName,
  schoolName,
  scores,
  onScoreChange,
  allGraded,
  gradedCount,
  pt,
  isModified,
  hasSubmitted,
  onSubmit,
  onExpire,
  language,
  t
}: MobileVotingViewportProps) {
  if (!s.active_presentation) return null;

  return (
    <div className="mobile-voting-viewport">
      {/* Top Academic Institution Banner with Crest & Language Selector */}
      <header className="mobile-voting-brand-bar">
        <div className="mobile-brand-left">
          <AcademicLogo logoUrl={s.branding?.logo_url} size={48} title={universityName} />
          <div className="mobile-brand-names">
            <h1 className="mobile-brand-univ">{universityName}</h1>
            {(schoolName || s.course) && (
              <div className="mobile-brand-sub">
                {schoolName && <span className="mobile-brand-school-tag">{schoolName}</span>}
                {schoolName && s.course && <span className="mobile-brand-dot">·</span>}
                {s.course && <span className="mobile-brand-course-tag">{s.course}</span>}
                {s.group && <span className="mobile-brand-group-tag">({s.group})</span>}
              </div>
            )}
          </div>
        </div>
        <div className="mobile-brand-right">
          <LanguageButton />
        </div>
      </header>

      {/* Presenter Stage Card */}
      <section className="mobile-presenter-bar">
        <div className="mobile-presenter-meta">
          <div className="mobile-presenter-avatar" aria-hidden="true">
            👤
          </div>
          <div className="mobile-presenter-details">
            <span className="mobile-presenter-kicker">
              {toGreekUppercase(t('evaluatingStudent'))}
            </span>
            <h2 className="mobile-presenter-name">
              {s.active_presentation.presenter_name}
            </h2>
            {s.active_presentation.title && (
              <p className="mobile-presenter-topic">
                «{s.active_presentation.title}»
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Sleek Progress Line matching Projector screen with remaining time pill */}
      <VotingCountdown
        closesAt={s.active_presentation.closes_at}
        totalDuration={(s as any).voting_duration || 60}
        onExpire={onExpire}
        lineOnly={true}
      />

      {/* Criteria rows with faint pastel 1-5 rating buttons that fill solid on selection */}
      <div className="mobile-compact-body">
        {s.criteria.map(c => {
          const currentVal = scores[c.id];
          return (
            <div key={c.id} className="mobile-compact-criterion">
              <div className="mobile-criterion-header">
                <h3 className="mobile-criterion-name">{c.name}</h3>
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
                      onClick={() => onScoreChange(c.id, n)}
                      title={`${n} - ${n === 1 ? t('scorePoor') : n === 2 ? t('scoreFair') : n === 3 ? t('scoreGood') : n === 4 ? t('scoreVeryGood') : t('scoreExcellent')}`}
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

      {/* Clean bottom action bar with pulsating and color-changing submit button */}
      <footer className="mobile-compact-footer">
        <button
          type="button"
          className={`mobile-submit-btn ${!allGraded || !pt ? 'disabled' : ''} ${isModified ? 'modified' : hasSubmitted ? 'submitted' : ''}`}
          disabled={!pt || !allGraded}
          onClick={onSubmit}
        >
          <span>{isModified ? '💾' : hasSubmitted ? '✓' : allGraded ? '🚀' : '✏️'}</span>
          <span>
            {isModified
              ? (language === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes')
              : hasSubmitted
              ? (language === 'el' ? 'Η ψήφος καταχωρίστηκε' : 'Vote Submitted')
              : !allGraded
              ? (language === 'el' ? `Βαθμολογήστε (${gradedCount}/${s.criteria.length})` : `Rate all criteria (${gradedCount}/${s.criteria.length})`)
              : t('submitRating')}
          </span>
        </button>
      </footer>
    </div>
  );
}
