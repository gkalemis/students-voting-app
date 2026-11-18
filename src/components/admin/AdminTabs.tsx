import React from 'react';
import { useT } from '../../context/LocaleContext';

export type AdminTab = 'users' | 'branding' | 'structure' | 'backup' | 'danger' | 'all';

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  usersCount: number;
}

export function AdminTabs({ activeTab, onTabChange, usersCount }: Props) {
  const { t } = useT();

  return (
    <div className="workspace-tabs" role="tablist" aria-label={t('admin')}>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'users'}
        className={`workspace-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        onClick={() => onTabChange('users')}
      >
        <span>👥</span>
        <span>{t('users')}</span>
        <span className="workspace-tab-count">{usersCount}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'branding'}
        className={`workspace-tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
        onClick={() => onTabChange('branding')}
      >
        <span>🏛️</span>
        <span>{t('branding')}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'structure'}
        className={`workspace-tab-btn ${activeTab === 'structure' ? 'active' : ''}`}
        onClick={() => onTabChange('structure')}
      >
        <span>🗂️</span>
        <span>{t('tabStructure')}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'backup'}
        className={`workspace-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
        onClick={() => onTabChange('backup')}
      >
        <span>💾</span>
        <span>{t('tabBackup')}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'danger'}
        className={`workspace-tab-btn danger-tab ${activeTab === 'danger' ? 'active' : ''}`}
        onClick={() => onTabChange('danger')}
      >
        <span>⚠️</span>
        <span>{t('dangerZone')}</span>
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
  );
}
