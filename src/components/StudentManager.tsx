import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { StudentDeleteModal } from './student/StudentDeleteModal';
import { StudentRosterList } from './student/StudentRosterList';

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

  useEffect(() => {
    if (!groupId || !groups.some(g => String(g.id) === String(groupId))) {
      setGroup(groups.length > 0 ? String(groups[0].id) : '');
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
    if (!activeGroupId) return setMessage(t('groupFirst'));
    const studentName = name.trim();
    if (!studentName) return setMessage(`${t('fullName')}: ${t('required')}`);

    try {
      await api(`/groups/${activeGroupId}/students`, json('POST', {
        full_name: studentName,
        presentation_title: subject.trim() || null
      }));
      setName('');
      setSubject('');
      setMessage(t('created'));
      load();
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
      setMessage(language === 'el' ? 'Ο φοιτητής αφαιρέθηκε επιτυχώς.' : 'Student removed successfully.');
      setDeleteTarget(null);
      load();
      onStudentsChanged?.();
    } catch (e) {
      setMessage(translateError(e, language));
    } finally {
      setBusyDelete(false);
    }
  }

  async function handleUpdateStudent(studentId: number, data: { full_name: string; presentation_title?: string | null }) {
    try {
      await api(`/students/${studentId}`, json('PUT', data));
      setMessage(t('saved'));
      load();
      onStudentsChanged?.();
    } catch (e) {
      setMessage(translateError(e, language));
      throw e;
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
            title={isRetracted ? (language === 'el' ? 'Ανάπτυξη' : 'Expand') : (language === 'el' ? 'Σύμπτυξη' : 'Collapse')}
          >
            {isRetracted ? (
              <><span>▼</span> <span>{language === 'el' ? 'Ανάπτυξη' : 'Expand'}</span></>
            ) : (
              <><span>▲</span> <span>{language === 'el' ? 'Σύμπτυξη' : 'Collapse'}</span></>
            )}
          </button>
        </div>
      </div>

      {isRetracted ? (
        <div className="retractable-collapsed-summary" onClick={() => setIsRetracted(false)} style={{ cursor: 'pointer' }}>
          <span>
            <b>{students.length}</b> {students.length === 1 ? (language === 'el' ? 'φοιτητής' : 'student') : (language === 'el' ? 'φοιτητές' : 'students')} {language === 'el' ? 'στην ομάδα.' : 'in group.'}
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 650, fontSize: '0.82rem' }}>
            {language === 'el' ? 'Άνοιγμα ▾' : 'Expand ▾'}
          </span>
        </div>
      ) : (
        <div className="retractable-body">
          {message && <p className="notice" style={{ margin: '0 0 .5rem 0' }}>{message}</p>}

          <label style={{ marginBottom: 0 }}>
            {t('group')}
            <select value={activeGroupId} onChange={e => setGroup(e.target.value)}>
              {groups.map(x => (
                <option value={x.id} key={x.id}>{x.title} · {x.presentation_date}</option>
              ))}
            </select>
          </label>

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

            <StudentRosterList
              students={filteredStudents}
              searchQuery={searchQuery}
              onDelete={setDeleteTarget}
              onUpdate={handleUpdateStudent}
            />
          </div>
        </div>
      )}

      <StudentDeleteModal
        target={deleteTarget}
        busy={busyDelete}
        onConfirm={executeRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
