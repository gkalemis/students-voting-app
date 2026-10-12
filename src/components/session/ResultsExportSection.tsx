import React from 'react';
import { useT } from '../../context/LocaleContext';
import { ResultsPodium } from '../ResultsPodium';
import { downloadAuth } from '../../api';

interface Props {
  sessionId: string | number;
  results: any[];
}

export function ResultsExportSection({ sessionId, results }: Props) {
  const { language } = useT();

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <ResultsPodium rows={results} isProjector={false} />
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: '#475569' }}>
          📥 {language === 'el' ? 'Λήψη βαθμολογιών:' : 'Export grades:'}
        </span>
        <a
          href={`/api/sessions/${sessionId}/export.csv`}
          onClick={downloadAuth}
          className="button secondary outline"
          style={{ padding: '.35rem .75rem', fontSize: '.88rem' }}
        >
          📄 CSV
        </a>
        <a
          href={`/api/sessions/${sessionId}/export.xlsx`}
          onClick={downloadAuth}
          className="button secondary outline"
          style={{ padding: '.35rem .75rem', fontSize: '.88rem' }}
        >
          📊 Excel (.xlsx)
        </a>
      </div>
    </div>
  );
}
