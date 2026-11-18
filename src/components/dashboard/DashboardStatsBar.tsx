import React from 'react';
import { useT } from '../../context/LocaleContext';

export type DashboardTab = 'live' | 'structure' | 'archive' | 'all';

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  coursesCount: number;
  periodsCount: number;
  groupsCount: number;
  waitingCount: number;
  pollsCount: number;
  archivedCount: number;
  hasActiveSession: boolean;
}

export function DashboardStatsBar({
  activeTab,
  onTabChange,
  coursesCount,
  periodsCount,
  groupsCount,
  waitingCount,
  pollsCount,
  archivedCount,
  hasActiveSession
}: Props) {
  const { t, language } = useT();
  const liveTotal = waitingCount + pollsCount + (hasActiveSession ? 1 : 0);
  const structureTotal = coursesCount + periodsCount + groupsCount;

  return (
    <>
      <div className="stats-summary-card">
        <div className="stats-bar-grid">
          <button
            type="button"
            className="stats-bar-item"
            onClick={() => onTabChange('structure')}
            title={t('tabStructure')}
          >
            <span className="stats-bar-label">{t('courses')}</span>
            <span className="stats-bar-value">{coursesCount}</span>
          </button>
          <button
            type="button"
            className="stats-bar-item"
            onClick={() => onTabChange('structure')}
            title={t('tabStructure')}
          >
            <span className="stats-bar-label">{t('periods')}</span>
            <span className="stats-bar-value">{periodsCount}</span>
          </button>
          <button
            type="button"
            className="stats-bar-item"
            onClick={() => onTabChange('structure')}
            title={t('tabStructure')}
          >
            <span className="stats-bar-label">{t('groups')}</span>
            <span className="stats-bar-value">{groupsCount}</span>
          </button>
          <button
            type="button"
            className="stats-bar-item"
            onClick={() => onTabChange('live')}
            title={t('tabLiveTeaching')}
          >
            <span className="stats-bar-label">{t('waitingSessions')}</span>
            <span className="stats-bar-value">{waitingCount}</span>
          </button>
          <button
            type="button"
            className="stats-bar-item"
            onClick={() => onTabChange('live')}
            title={t('tabLiveTeaching')}
          >
            <span className="stats-bar-label">{t('quizPoll')}</span>
            <span className="stats-bar-value">{pollsCount}</span>
          </button>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 650 }}>
          🏛️ {language === 'el' ? 'Κέντρο Διοίκησης Μαθημάτων' : 'Academic Command Hub'}
        </div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label={t('dashboard')}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'live'}
          className={`workspace-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => onTabChange('live')}
        >
          <span>🚀</span>
          <span>{t('tabLiveTeaching')}</span>
          <span className="workspace-tab-count">{liveTotal}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'structure'}
          className={`workspace-tab-btn ${activeTab === 'structure' ? 'active' : ''}`}
          onClick={() => onTabChange('structure')}
        >
          <span>🏛️</span>
          <span>{t('tabStructure')}</span>
          <span className="workspace-tab-count">{structureTotal}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'archive'}
          className={`workspace-tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => onTabChange('archive')}
        >
          <span>🔒</span>
          <span>{t('tabArchive')}</span>
          <span className="workspace-tab-count">{archivedCount}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`workspace-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onTabChange('all')}
        >
          <span>📋</span>
          <span>{t('tabAll')}</span>
        </button>
      </div>
    </>
  );
}
