import React from 'react';

interface CsvPreviewCardProps {
  preview: {
    headers: string[];
    rows: string[][];
    total: number;
  };
  language: string;
}

export function CsvPreviewCard({ preview, language }: CsvPreviewCardProps) {
  if (!preview.headers.length) return null;

  return (
    <div className="csv-preview-card" style={{ marginTop: '1rem', background: '#f8fafc', padding: '.75rem', borderRadius: 8, border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
        <strong style={{ fontSize: '.85rem', color: '#1e293b' }}>
          👁️ {language === 'el' ? 'Προεπισκόπηση δεδομένων:' : 'Data preview:'}
        </strong>
        <span style={{ fontSize: '.8rem', color: '#64748b' }}>
          {language === 'el' ? `${preview.total} εγγραφές` : `${preview.total} rows`}
        </span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: '180px' }}>
        <table style={{ width: '100%', fontSize: '.8rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#e2e8f0', color: '#334155' }}>
              {preview.headers.map((h, i) => (
                <th key={i} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid #e2e8f0' }}>
                {row.map((col, ci) => (
                  <td key={ci} style={{ padding: '4px 8px', color: '#0f172a' }}>
                    {col}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
