import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';

interface StudentManagerProps {
  groups: any[];
  onOpenImport?: () => void;
  onStudentsChanged?: () => void;
}

export function StudentManager({ groups, onOpenImport, onStudentsChanged }: StudentManagerProps) {
  const { t, language } = useT();
  const [groupId, setGroup] = useState(String(groups[0]?.id || ''));
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  // Keep groupId in sync with groups whenever groups updates
  useEffect(() => {
    if (!groupId || !groups.some(g => String(g.id) === String(groupId))) {
      if (groups.length > 0) {
        setGroup(String(groups[0].id));
      } else {
        setGroup('');
      }
    }
  }, [groups, groupId]);

  const activeGroupId = (groupId && groups.some(g => String(g.id) === String(groupId)))
    ? groupId
    : String(groups[0]?.id || '');

  const load = () => {
    if (activeGroupId) {
      api(`/groups/${activeGroupId}/students`)
        .then(setStudents)
        .catch(e => setMessage(translateError(e, language)));
    } else {
      setStudents([]);
    }
  };

  useEffect(() => {
    load();
  }, [activeGroupId]);

  if (!groups.length) return null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroupId) {
      setMessage(t('groupFirst'));
      return;
    }
    const studentName = name.trim();
    if (!studentName) {
      setMessage(`${t('fullName')}: ${t('required')}`);
      return;
    }
    try {
      await api(`/groups/${activeGroupId}/students`, json('POST', {
        full_name: studentName,
        presentation_title: subject.trim() || null
      }));
      setName('');
      setSubject('');
      setMessage(t('created'));
      load();
      // Instantly notify parent dashboard to refresh Course Structure (HierarchyView)
      onStudentsChanged?.();
    } catch (e) {
      setMessage(translateError(e, language));
    }
  }

  async function executeRemove() {
    if (!deleteTarget || !activeGroupId) return;
    setBusyDelete(true);
    try {
      await api(`/groups/${activeGroupId}/students/${deleteTarget.id}`, json('DELETE'));
      setMessage(t('actionDone'));
      setDeleteTarget(null);
      load();
      // Instantly notify parent dashboard to refresh Course Structure (HierarchyView)
      onStudentsChanged?.();
    } catch (e) {
      setMessage(translateError(e, language));
    } finally {
      setBusyDelete(false);
    }
  }

  const selectedGroupObj = groups.find(g => String(g.id) === activeGroupId);
  const filteredStudents = searchQuery.trim()
    ? students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.presentation_title && s.presentation_title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : students;

  return (
    <section className="retractable-tool" aria-label={t('manageStudents')}>
      {/* Retractable Header Bar */}
      <div
        className={`retractable-header ${isRetracted ? 'collapsed' : ''}`}
        onClick={() => setIsRetracted(prev => !prev)}
      >
        <div className="retractable-title-group">
          <h2 className="retractable-title">
            <span>👥</span>
            <span>{t('manageStudents')}</span>
          </h2>
          <span className="retractable-count-badge">
            {students.length} {students.length === 1 ? (language === 'el' ? 'φοιτητής' : 'student') : (language === 'el' ? 'φοιτητές' : 'students')}
          </span>
          {selectedGroupObj && (
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              · {selectedGroupObj.title}
            </span>
          )}
        </div>

        <div className="retractable-actions" onClick={e => e.stopPropagation()}>
          {onOpenImport && (
            <button
              type="button"
              className="outline import-csv-btn"
              style={{ fontSize: '0.82rem', padding: '0.3rem 0.65rem' }}
              onClick={onOpenImport}
              title={t('importCsv')}
            >
              📥 {t('importCsv')}
            </button>
          )}

          <button
            type="button"
            className="btn-toggle-retract"
            onClick={() => setIsRetracted(prev => !prev)}
            aria-expanded={!isRetracted}
            title={isRetracted ? (language === 'el' ? 'Ανάπτυξη εργαλείου' : 'Expand tool') : (language === 'el' ? 'Σύμπτυξη εργαλείου' : 'Collapse tool')}
          >
            {isRetracted ? (
              <><span>▼</span> <span>{language === 'el' ? 'Ανάπτυξη' : 'Expand'}</span></>
            ) : (
              <><span>▲</span> <span>{language === 'el' ? 'Σύμπτυξη' : 'Collapse'}</span></>
            )}
          </button>
        </div>
      </div>

      {/* Retracted Summary Indicator */}
      {isRetracted ? (
        <div
          className="retractable-collapsed-summary"
          onClick={() => setIsRetracted(false)}
          style={{ cursor: 'pointer' }}
        >
          <span>
            <b>{students.length}</b> {students.length === 1 ? (language === 'el' ? 'φοιτητής' : 'student') : (language === 'el' ? 'φοιτητές' : 'students')} {language === 'el' ? 'στην ομάδα.' : 'in group.'} {language === 'el' ? 'Κάντε κλικ για άνοιγμα & διαχείριση.' : 'Click to expand & manage.'}
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 650, fontSize: '0.82rem' }}>
            {language === 'el' ? 'Άνοιγμα ▾' : 'Expand ▾'}
          </span>
        </div>
      ) : (
        /* Expanded Retractable Tool Body */
        <div className="retractable-body">
          {message && <p className="notice" style={{ margin: '0 0 .5rem 0' }}>{message}</p>}

          {/* Group Selector */}
          <label style={{ marginBottom: 0 }}>
            {t('group')}
            <select value={activeGroupId} onChange={e => setGroup(e.target.value)}>
              {groups.map(x => (
                <option value={x.id} key={x.id}>{x.title} · {x.presentation_date}</option>
              ))}
            </select>
          </label>

          {/* Add Student Inline Form */}
          <form className="card form-grid" onSubmit={add} style={{ margin: 0, padding: '1rem' }}>
            <label style={{ margin: 0 }}>
              {t('fullName')}
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={language === 'el' ? 'π.χ. Μαρία Παπαδοπούλου' : 'e.g. Maria Papadopoulou'}
                required
              />
            </label>
            <label style={{ margin: 0 }}>
              {t('presentationSubject')}
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={language === 'el' ? 'π.χ. Σχεδιασμός Κυκλικού Κόμβου' : 'e.g. Traffic Network Analysis'}
              />
            </label>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '.25rem' }}>
              <button type="submit" style={{ minHeight: '36px', padding: '0.45rem 1rem' }}>
                + {t('add')}
              </button>
            </div>
          </form>

          {/* Student Roster Viewport with Scroll Containment */}
          <div className="student-roster-wrap">
            <div className="student-roster-toolbar">
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155' }}>
                {t('students')} ({filteredStudents.length}{searchQuery && ` / ${students.length}`}):
              </span>

              {students.length > 4 && (
                <input
                  type="search"
                  className="student-search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={language === 'el' ? '🔍 Αναζήτηση φοιτητή...' : '🔍 Search student...'}
                />
              )}
            </div>

            {filteredStudents.length > 0 ? (
              <div className="student-roster-scroll">
                {filteredStudents.map(x => (
                  <div className="student-row-compact" key={x.id}>
                    <div className="student-info">
                      <span className="student-name">{x.full_name}</span>
                      {x.presentation_title && (
                        <span className="student-topic" title={x.presentation_title}>
                          «{x.presentation_title}»
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="danger btn-student-delete"
                      onClick={() => setDeleteTarget(x)}
                      title={t('delete')}
                    >
                      🗑️ {t('delete')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', background: '#f8fafc', borderRadius: 8 }}>
                {searchQuery
                  ? (language === 'el' ? 'Δεν βρέθηκαν φοιτητές με αυτή την αναζήτηση.' : 'No students found matching search.')
                  : (language === 'el' ? 'Δεν υπάρχουν ακόμη φοιτητές σε αυτή την ομάδα. Προσθέστε παραπάνω ή εισαγάγετε με CSV.' : 'No students in this group yet. Add above or import via CSV.')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Student Deletion */}
      {deleteTarget && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="card" style={{ maxWidth: 440 }}>
            <h2>🗑️ {t('confirmDelete')}</h2>
            <p style={{ margin: '.8rem 0' }}>
              <b>{deleteTarget.full_name}</b> {deleteTarget.presentation_title ? `(«${deleteTarget.presentation_title}»)` : ''}
            </p>
            <div className="actions" style={{ marginTop: '1.2rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="secondary"
                disabled={busyDelete}
                onClick={() => setDeleteTarget(null)}
              >
                {t('cancel')}
              </button>
              <button
                className="danger"
                disabled={busyDelete}
                onClick={executeRemove}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
