import React from 'react';
import { useT } from '../../context/LocaleContext';
import { toGreekUppercase } from '../../utils/greek';
import { FormKind } from '../../types';

interface Props {
  onOpen: (kind: FormKind) => void;
  onOpenImport: () => void;
  onLoadSampleFixture: () => void;
  enableSampleFixtureButton?: boolean;
}

export function WorkflowBar({ onOpen, onOpenImport, onLoadSampleFixture, enableSampleFixtureButton = true }: Props) {
  const { t, language } = useT();

  return (
    <div className="dashboard-action-panel">
      <div className="action-panel-workflow">
        <span className="panel-section-title" lang="el">
          {language === 'el' ? toGreekUppercase('1. Δομή μαθημάτων (Βήματα)') : '1. Course structure (Steps)'}
        </span>
        <div className="workflow-buttons">
          <button
            type="button"
            className="btn-workflow"
            onClick={() => onOpen('course')}
            title={language === 'el' ? 'Βήμα 1: Μάθημα' : 'Step 1: Course'}
          >
            <span className="workflow-step-num">1</span>
            <span>+ {t('course')}</span>
          </button>
          <span className="workflow-arrow" aria-hidden="true">→</span>
          <button
            type="button"
            className="btn-workflow"
            onClick={() => onOpen('period')}
            title={language === 'el' ? 'Βήμα 2: Ακαδημαϊκή περίοδος' : 'Step 2: Academic period'}
          >
            <span className="workflow-step-num">2</span>
            <span>+ {t('period')}</span>
          </button>
          <span className="workflow-arrow" aria-hidden="true">→</span>
          <button
            type="button"
            className="btn-workflow"
            onClick={() => onOpen('group')}
            title={language === 'el' ? 'Βήμα 3: Φοιτητική ομάδα' : 'Step 3: Student group'}
          >
            <span className="workflow-step-num">3</span>
            <span>+ {t('group')}</span>
          </button>
          <span className="workflow-arrow" aria-hidden="true">→</span>
          <button
            type="button"
            className="btn-workflow"
            onClick={() => onOpen('session')}
            title={language === 'el' ? 'Βήμα 4: Συνεδρία σε αναμονή' : 'Step 4: Session in waiting'}
          >
            <span className="workflow-step-num">4</span>
            <span>+ {t('session')}</span>
          </button>
        </div>
      </div>

      <div className="action-panel-bulk">
        <span className="panel-section-title" lang="el">
          {language === 'el' ? toGreekUppercase('2. Μαζικά εργαλεία') : '2. Bulk utilities'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenImport}
            className="outline import-csv-btn dashboard-import-btn"
          >
            <span>📥</span>
            <span>{t('importCsv')}</span>
          </button>
          {enableSampleFixtureButton && (
            <button
              type="button"
              onClick={onLoadSampleFixture}
              className="outline import-csv-btn dashboard-import-btn"
              style={{ borderColor: '#0ea5e9', color: '#0ea5e9' }}
              title={language === 'el' ? 'Φόρτωση δοκιμαστικού πακέτου συνεδρίας από fixtures' : 'Load sample session fixture package'}
            >
              <span>📦</span>
              <span>{t('loadSampleFixture')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
