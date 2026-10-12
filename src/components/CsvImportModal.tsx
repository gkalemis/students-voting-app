import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { toGreekUppercase } from '../utils/greek';
import { downloadSampleCsv } from './csv/csvSamples';
import { parsePreview } from './csv/csvPreviewUtil';
import { CsvPreviewCard } from './csv/CsvPreviewCard';

interface Props {
  groups: any[];
  close: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({ groups, close, onSuccess }: Props) {
  const { t, language } = useT();
  const [mode, setMode] = useState<'hierarchy' | 'students'>('hierarchy');
  const [selectedGroup, setSelectedGroup] = useState<string>(String(groups[0]?.id || ''));
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultMsg, setResultMsg] = useState('');

  useEffect(() => {
    if (!selectedGroup || !groups.some(g => String(g.id) === String(selectedGroup))) {
      if (groups.length > 0) setSelectedGroup(String(groups[0].id));
    }
  }, [groups, selectedGroup]);

  const activeSelectedGroup = (selectedGroup && groups.some(g => String(g.id) === String(selectedGroup)))
    ? selectedGroup
    : String(groups[0]?.id || '');

  const preview = parsePreview(csvText);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '');
      setCsvText(text);
    };
    reader.readAsText(file, 'utf-8');
  }

  async function handleImport() {
    if (!csvText.trim()) {
      setError(language === 'el' ? 'Παρακαλώ επιλέξτε ή επικολλήστε ένα αρχείο CSV.' : 'Please select or paste CSV data.');
      return;
    }
    if (mode === 'students' && !activeSelectedGroup) {
      setError(t('groupFirst'));
      return;
    }

    setLoading(true);
    setError('');
    setResultMsg('');

    try {
      if (mode === 'hierarchy') {
        const res = await api('/import/hierarchy-csv', json('POST', { csv_data: csvText }));
        setResultMsg(
          language === 'el'
            ? `Επιτυχής εισαγωγή: ${res.imported_courses} μαθήματα, ${res.imported_periods} περίοδοι, ${res.imported_groups} ομάδες, ${res.imported_students} φοιτητές!`
            : `Successfully imported: ${res.imported_courses} courses, ${res.imported_periods} periods, ${res.imported_groups} groups, ${res.imported_students} students!`
        );
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        const res = await api('/import/students-csv', json('POST', {
          group_id: Number(activeSelectedGroup),
          csv_data: csvText
        }));
        setResultMsg(
          language === 'el'
            ? `Επιτυχής εισαγωγή: ${res.imported_students} φοιτητές προστέθηκαν στην ομάδα!`
            : `Successfully imported: ${res.imported_students} students added to the group!`
        );
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err) {
      setError(translateError(err, language));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 640, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>📥 {t('importCsv')}</h2>
          <button type="button" className="secondary" style={{ padding: '.25rem .5rem', fontSize: '1rem', minWidth: 'auto' }} onClick={close}>
            ✕
          </button>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {resultMsg && <p className="notice" role="status">{resultMsg}</p>}

        {/* Segmented Mode Selector */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: '1.2rem', gap: 4 }}>
          <button
            type="button"
            onClick={() => { setMode('hierarchy'); setError(''); setCsvText(''); setFileName(''); }}
            className={mode === 'hierarchy' ? 'primary' : 'secondary'}
            style={{ flex: 1, padding: '.45rem', fontSize: '.88rem', border: 'none' }}
          >
            🏛️ {language === 'el' ? 'Πλήρης Δομή (Μάθημα, Περίοδος, Ομάδα, Φοιτητής)' : 'Full Hierarchy (Course, Period, Group, Student)'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('students'); setError(''); setCsvText(''); setFileName(''); }}
            className={mode === 'students' ? 'primary' : 'secondary'}
            style={{ flex: 1, padding: '.45rem', fontSize: '.88rem', border: 'none' }}
          >
            👥 {language === 'el' ? 'Φοιτητές σε Ομάδα' : 'Students into Group'}
          </button>
        </div>

        {/* Group selector for Students mode */}
        {mode === 'students' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '.88rem', fontWeight: 600, marginBottom: '.3rem' }}>
              {t('group')}:
            </label>
            {groups.length > 0 ? (
              <select
                value={activeSelectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                style={{ width: '100%', padding: '.45rem' }}
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} {g.course_name ? `(${g.course_name})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ color: '#ef4444', fontSize: '.85rem' }}>{t('groupFirst')}</p>
            )}
          </div>
        )}

        {/* Template Download & File Picker */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.8rem' }}>
          <label className="button secondary outline" style={{ cursor: 'pointer', margin: 0, padding: '.4rem .8rem', fontSize: '.85rem' }}>
            📁 {fileName ? fileName : language === 'el' ? 'Επιλογή αρχείου (.csv)' : 'Select CSV file'}
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button
            type="button"
            className="secondary outline"
            onClick={() => downloadSampleCsv(mode)}
            style={{ fontSize: '.85rem', padding: '.4rem .8rem' }}
          >
            📋 {language === 'el' ? 'Λήψη προτύπου CSV' : 'Download sample template'}
          </button>
        </div>

        {/* Text Area for direct paste or file view */}
        <label style={{ display: 'block', fontSize: '.85rem', color: '#475569', marginBottom: '.3rem' }}>
          {language === 'el' ? 'Περιεχόμενο CSV (ή επικολλήστε απευθείας):' : 'CSV text (or paste directly):'}
        </label>
        <textarea
          rows={6}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder={mode === 'hierarchy'
            ? 'Μάθημα,Περίοδος,Ομάδα,Φοιτητής,Θέμα\n...'
            : 'Φοιτητής,Θέμα\n...'}
          style={{ width: '100%', fontSize: '.85rem', fontFamily: 'monospace' }}
        />

        <CsvPreviewCard preview={preview} language={language} />

        {/* Actions */}
        <div className="actions" style={{ marginTop: '1.2rem', justifyContent: 'flex-end', gap: '.6rem' }}>
          <button
            type="button"
            className="primary"
            disabled={loading || !csvText.trim()}
            onClick={handleImport}
          >
            {loading ? '...' : `🚀 ${toGreekUppercase(t('importCsv'))}`}
          </button>
          <button type="button" className="secondary" onClick={close} disabled={loading}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
