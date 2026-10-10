import React from 'react';
import { Brand } from '../types';
import { useT } from '../context/LocaleContext';
import { AcademicLogo } from './AcademicLogo';
import { VotingCountdown } from './VotingCountdown';
import { toGreekUppercase } from '../utils/greek';

interface PresentationHeaderCardProps {
  brand?: Brand;
  courseName?: string;
  periodName?: string;
  groupTitle?: string;
  presenterName: string;
  presentationTitle?: string | null;
  closesAt?: string;
  voteCount?: number;
  categories?: { id?: number; name: string; weight: number }[];
  isProjector?: boolean;
  actions?: React.ReactNode;
  onExpire?: () => void;
}

export function PresentationHeaderCard({
  brand,
  courseName,
  periodName,
  groupTitle,
  presenterName,
  presentationTitle,
  closesAt,
  voteCount,
  categories,
  isProjector = false,
  actions,
  onExpire
}: PresentationHeaderCardProps) {
  const { t } = useT();

  const university = brand?.university_name || t('app');
  const school = brand?.school_name;
  const department = brand?.department_name;

  return (
    <section className={`presentation-hero-card ${isProjector ? 'projector-hero' : ''}`}>
      {/* 1. Institution Identity Header: Logo, University, School, Department */}
      <div className="pres-institution-banner">
        <AcademicLogo
          logoUrl={brand?.logo_url}
          size={isProjector ? 76 : 56}
          title={university}
        />
        <div className="pres-institution-meta">
          <div className="pres-university-title">{university}</div>
          <div className="pres-hierarchy-badges">
            {school && (
              <span className="pres-badge school-badge" title={school}>
                🏛️ {school}
              </span>
            )}
            {department && (
              <span className="pres-badge dept-badge" title={department}>
                📚 {department}
              </span>
            )}
            {courseName && (
              <span className="pres-badge course-badge">
                🎓 {courseName}{periodName ? ` · ${periodName}` : ''}{groupTitle ? ` · ${groupTitle}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Presenter Evaluation Details */}
      <div className="pres-body">
        <div className="pres-status-row">
          <span className="live-pulse-badge">
            <span className="pulse-dot" />
            {t('live')} · {t('votingOpen')}
          </span>
          {voteCount !== undefined && (
            <span className="votes-counter-badge">
              👥 {voteCount} {t('votes')}
            </span>
          )}
        </div>

        <div className="pres-student-highlight">
          <div className="pres-meta-tag" lang="el">{toGreekUppercase(t('evaluatingStudent'))}</div>
          <h1 className="pres-student-name">{presenterName}</h1>
          {presentationTitle && (
            <p className="pres-topic-quote">
              <span className="quote-mark">«</span>
              {presentationTitle}
              <span className="quote-mark">»</span>
            </p>
          )}
        </div>

        {/* Categories Bar */}
        {categories && categories.length > 0 && (
          <div className="pres-categories-bar">
            <span className="pres-categories-label">🏷️ {t('gradeCategories')}:</span>
            <div className="pres-categories-chips">
              {categories.map((c, i) => (
                <span key={c.id || i} className="pres-category-chip">
                  {c.name} <b className="chip-weight">{c.weight}%</b>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. Live Countdown Timer while grading */}
        {closesAt && <VotingCountdown closesAt={closesAt} onExpire={onExpire} />}

        {/* 4. Optional Controls / Actions */}
        {actions && <div className="pres-actions-row">{actions}</div>}
      </div>
    </section>
  );
}
