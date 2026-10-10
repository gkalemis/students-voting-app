import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { toGreekUppercase } from '../utils/greek';

interface Props {
  groups: any[];
  close: () => void;
  onSuccess: () => void;
}

function parsePreview(text: string) {
  const clean = text.replace(/^\ufeff/, '').trim();
  if (!clean) return { headers: [], rows: [], total: 0 };
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [], total: 0 };
  const sample = lines[0];
  const delim = sample.includes(';') ? ';' : sample.includes('\t') ? '\t' : ',';
  
  const splitLine = (line: string) => {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === delim && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = splitLine(lines[0]);
  const dataLines = lines.slice(1).filter(l => l.trim().length > 0);
  const rows = dataLines.slice(0, 3).map(splitLine);
  return { headers, rows, total: dataLines.length };
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

  const sampleHierarchy = '\ufeffΜάθημα,Περίοδος,Ομάδα,Φοιτητής,Θέμα\n' +
    'Συγκοινωνιακά Έργα,Χειμερινό 2024-2025,Ομάδα 1,Γεώργιος Παπαδόπουλος,Σχεδιασμός Κυκλικού Κόμβου\n' +
    'Συγκοινωνιακά Έργα,Χειμερινό 2024-2025,Ομάδα 1,Μαρία Ιωάννου,Αξιολόγηση Οδικής Ασφάλειας\n' +
    'Οδοποιία Ι,Χειμερινό 2024-2025,Ομάδα Α,Νικόλαος Γεωργίου,Μέθοδοι Χάραξης Οδού\n';

  const sampleStudents = '\ufeffΦοιτητής,Θέμα\n' +
    'Γεώργιος Παπαδόπουλος,Σχεδιασμός Κυκλικού Κόμβου\n' +
    'Μαρία Ιωάννου,Αξιολόγηση Οδικής Ασφάλειας\n' +
    'Νικόλαος Γεωργίου,Μέθοδοι Χάραξης Οδού\n';

  function downloadSample(type: 'hierarchy' | 'students') {
    const content = type === 'hierarchy' ? sampleHierarchy : sampleStudents;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'hierarchy' ? 'template-hierarchy.csv' : 'template-students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResultMsg('');
    if (!csvText.trim()) {
      setError(t('csvNoValidRows'));
      return;
    }
    setLoading(true);

    try {
      if (mode === 'hierarchy') {
        const res = await api('/import/hierarchy', json('POST', { csvText }));
        const s = res.summary;
        const msg = `${t('csvSuccessSummary')} (${s.courses_created} ${t('courses')}, ${s.periods_created} ${t('periods')}, ${s.groups_created} ${t('groups')}, ${s.students_created} ${t('students')})`;
        setResultMsg(msg);
      } else {
        const targetGid = activeSelectedGroup || String(groups[0]?.id || '');
        if (!targetGid) {
          setError(t('groupFirst'));
          setLoading(false);
          return;
        }
        const res = await api('/import/students', json('POST', {
          groupId: Number(targetGid),
          csvText
        }));
        setResultMsg(`${t('csvSuccessSummary')} (${res.count} ${t('students')})`);
      }
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      setError(translateError(err, language));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="card csv-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="csv-modal-header">
          <div className="csv-title-group">
            <span className="csv-icon-badge" aria-hidden="true">📊</span>
            <div>
              <h2>{t('csvImportTitle')}</h2>
              <p className="csv-subtitle">
                {mode === 'hierarchy'
                  ? (language === 'el' ? 'Μαζική δημιουργία μαθημάτων, περιόδων, ομάδων και φοιτητών με μία κίνηση' : 'Batch create courses, periods, groups, and students in one step')
                  : (language === 'el' ? 'Μαζική εισαγωγή φοιτητών και θεμάτων σε συγκεκριμένη ομάδα' : 'Batch import student roster and topics into a selected group')
                }
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={close} aria-label={t('cancel')}>✕</button>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="csv-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'hierarchy'}
            className={`csv-mode-tab ${mode === 'hierarchy' ? 'active' : ''}`}
            onClick={() => { setMode('hierarchy'); setError(''); setResultMsg(''); }}
          >
            <span className="tab-icon" aria-hidden="true">🏛️</span>
            <div className="tab-labels">
              <span className="tab-title">{t('csvModeHierarchy')}</span>
              <span className="tab-desc">{language === 'el' ? 'Πλήρης ακαδημαϊκή δομή' : 'Full academic hierarchy'}</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'students'}
            className={`csv-mode-tab ${mode === 'students' ? 'active' : ''}`}
            onClick={() => { setMode('students'); setError(''); setResultMsg(''); }}
          >
            <span className="tab-icon" aria-hidden="true">👥</span>
            <div className="tab-labels">
              <span className="tab-title">{t('csvModeStudents')}</span>
              <span className="tab-desc">{language === 'el' ? 'Φοιτητές σε συγκεκριμένη ομάδα' : 'Students into specific group'}</span>
            </div>
          </button>
        </div>

        {/* Target Group Selector (if students mode) */}
        {mode === 'students' && (
          <div className="csv-target-group-panel">
            <label className="csv-field-label">
              <span>🎯 {t('csvTargetGroup')}</span>
              <select
                className="csv-group-select"
                value={activeSelectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                required
              >
                {groups.length === 0 && <option value="">-- {t('groupFirst')} --</option>}
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.title} · {g.presentation_date}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Format Cheat Sheet & Sample Download Bar */}
        <div className="csv-format-card">
          <div className="csv-format-info">
            <span className="format-kicker" lang="el">{language === 'el' ? toGreekUppercase('Απαιτούμενες στήλες CSV:') : 'Expected CSV columns:'}</span>
            <div className="csv-column-chips" lang="el">
              {mode === 'hierarchy' ? (
                <>
                  <span className="csv-col-tag required" lang="el">{language === 'el' ? 'Μάθημα' : 'Course'}</span>
                  <span className="csv-col-tag required" lang="el">{language === 'el' ? 'Περίοδος' : 'Period'}</span>
                  <span className="csv-col-tag required" lang="el">{language === 'el' ? 'Ομάδα' : 'Group'}</span>
                  <span className="csv-col-tag required" lang="el">{language === 'el' ? 'Φοιτητής' : 'Student'}</span>
                  <span className="csv-col-tag optional" lang="el">{language === 'el' ? 'Θέμα (προαιρετικό)' : 'Topic (optional)'}</span>
                </>
              ) : (
                <>
                  <span className="csv-col-tag required" lang="el">{language === 'el' ? 'Φοιτητής' : 'Student'}</span>
                  <span className="csv-col-tag optional" lang="el">{language === 'el' ? 'Θέμα (προαιρετικό)' : 'Topic (optional)'}</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className="outline csv-download-sample-btn"
            onClick={() => downloadSample(mode)}
            title={t('csvSampleDownload')}
          >
            📥 {t('csvSampleDownload')}
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && <p className="error" role="alert">{error}</p>}
        {resultMsg && <p className="notice" role="status" style={{ fontWeight: 600 }}>{resultMsg}</p>}

        {/* Dual Input Area: File Dropzone + Text Editor */}
        <form onSubmit={handleImport} className="csv-form">
          {/* File Upload Zone */}
          <div className="csv-upload-zone">
            <label className="csv-file-label">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="csv-file-hidden-input"
              />
              <div className="csv-upload-content">
                <span className="upload-icon" aria-hidden="true">📁</span>
                <div>
                  <strong className="upload-title">
                    {fileName ? fileName : (language === 'el' ? 'Επιλογή αρχείου CSV / TXT' : 'Select or drop CSV / TXT file')}
                  </strong>
                  <span className="upload-hint">
                    {fileName
                      ? (language === 'el' ? 'Κάντε κλικ για αλλαγή αρχείου' : 'Click to change file')
                      : (language === 'el' ? 'Υποστηρίζονται αρχεία διαχωρισμένα με κόμμα, ελληνικό ερωτηματικό (;) ή tab' : 'Comma, semicolon (;), or tab separated files supported')}
                  </span>
                </div>
                {fileName && (
                  <button
                    type="button"
                    className="csv-clear-file-btn"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFileName('');
                      setCsvText('');
                    }}
                  >
                    ✕ {language === 'el' ? 'Καθαρισμός' : 'Clear'}
                  </button>
                )}
              </div>
            </label>
          </div>

          {/* Or Paste Text */}
          <div className="csv-editor-section">
            <div className="csv-editor-header">
              <label htmlFor="csv-textarea" className="csv-field-label">
                {t('csvPasteOrUpload')}
              </label>
              {preview.total > 0 && (
                <span className="csv-count-badge">
                  ✓ {preview.total} {preview.total === 1 ? (language === 'el' ? 'εγγραφή' : 'record') : (language === 'el' ? 'εγγραφές' : 'records')}
                </span>
              )}
            </div>
            <textarea
              id="csv-textarea"
              rows={5}
              value={csvText}
              onChange={e => {
                setCsvText(e.target.value);
                if (!e.target.value) setFileName('');
              }}
              placeholder={t('csvPastePlaceholder')}
              className="csv-textarea"
              spellCheck={false}
            />
          </div>

          {/* Live Preview Table */}
          {preview.rows.length > 0 && (
            <div className="csv-live-preview">
              <div className="csv-preview-title">
                <span>👁️ {t('csvPreview')} ({language === 'el' ? `Πρώτες ${preview.rows.length} από ${preview.total}` : `First ${preview.rows.length} of ${preview.total}`}):</span>
              </div>
              <div className="csv-preview-table-wrap">
                <table className="csv-preview-table" lang="el">
                  <thead>
                    <tr>
                      {preview.headers.map((h, i) => (
                        <th key={i} lang="el">{toGreekUppercase(h || `Col ${i + 1}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {preview.headers.map((_, cIdx) => (
                          <td key={cIdx}>{row[cIdx] || <em style={{ color: '#94a3b8' }}>-</em>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="csv-modal-actions">
            <button type="button" className="secondary" onClick={close}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="csv-submit-btn"
              disabled={loading || !csvText.trim()}
            >
              {loading ? t('loading') : (
                preview.total > 0
                  ? `🚀 ${t('csvImportBtn')} (${preview.total})`
                  : `🚀 ${t('csvImportBtn')}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
