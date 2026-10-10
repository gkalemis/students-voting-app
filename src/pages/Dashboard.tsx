import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api } from '../api';
import { translateError, translateStatus } from '../i18n';
import { FormKind } from '../types';
import { Layout } from '../components/Layout';
import { ResourceSection } from '../components/ResourceSection';
import { ResourceForm } from '../components/ResourceForm';
import { StudentManager } from '../components/StudentManager';
import { HierarchyView } from '../components/HierarchyView';
import { CsvImportModal } from '../components/CsvImportModal';
import { toGreekUppercase } from '../utils/greek';

export function Dashboard() {
  const { t, language } = useT();
  const [courses, setCourses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState<FormKind>(null);
  const [showImport, setShowImport] = useState(false);
  const [studentVersion, setStudentVersion] = useState(0);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');

  const onStudentsChanged = () => setStudentVersion(v => v + 1);

  const reload = () =>
    Promise.all([api('/courses'), api('/periods'), api('/groups'), api('/sessions')])
      .then(([a, b, c, d]) => {
        setCourses(a);
        setPeriods(b);
        setGroups(c);
        setSessions(d);
      })
      .catch(e => setErr(translateError(e, language)));

  useEffect(() => {
    reload();
  }, [language]);

  const open = (kind: FormKind) => {
    setErr('');
    setNotice('');
    if (kind === 'group' && !courses.length) return setErr(t('courseFirst'));
    if (kind === 'session' && !courses.length) return setErr(t('courseFirst'));
    if (kind === 'session' && !groups.length) return setErr(t('groupFirst'));
    setForm(kind);
  };

  const saved = () => {
    setForm(null);
    setNotice(t('created'));
    reload();
  };

  return (
    <Layout>
      <div className="dashboard-header-bar">
        <div>
          <h1>{t('lecturerDashboard')}</h1>
          <p className="dashboard-subtitle">
            {language === 'el'
              ? 'Διαχείριση μαθημάτων, περιόδων, ομάδων και συνεδριών ψηφοφορίας'
              : 'Management of courses, academic periods, student groups, and voting sessions'}
          </p>
        </div>

        <div className="dashboard-main-cta">
          <button
            type="button"
            className="btn-create-session"
            onClick={() => open('session')}
          >
            <span>🚀</span>
            <span>+ {t('session')}</span>
          </button>
        </div>
      </div>

      {err && <p className="error" role="alert">{err}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}

      {/* Structured Action Toolbar */}
      <div className="dashboard-action-panel">
        <div className="action-panel-workflow">
          <span className="panel-section-title" lang="el">
            {language === 'el' ? toGreekUppercase('1. Δομή μαθημάτων (Βήματα)') : '1. Course structure (Steps)'}
          </span>
          <div className="workflow-buttons">
            <button
              type="button"
              className="btn-workflow"
              onClick={() => open('course')}
              title={language === 'el' ? 'Βήμα 1: Μάθημα' : 'Step 1: Course'}
            >
              <span className="workflow-step-num">1</span>
              <span>+ {t('course')}</span>
            </button>
            <span className="workflow-arrow" aria-hidden="true">→</span>
            <button
              type="button"
              className="btn-workflow"
              onClick={() => open('period')}
              title={language === 'el' ? 'Βήμα 2: Ακαδημαϊκή περίοδος' : 'Step 2: Academic period'}
            >
              <span className="workflow-step-num">2</span>
              <span>+ {t('period')}</span>
            </button>
            <span className="workflow-arrow" aria-hidden="true">→</span>
            <button
              type="button"
              className="btn-workflow"
              onClick={() => open('group')}
              title={language === 'el' ? 'Βήμα 3: Φοιτητική ομάδα' : 'Step 3: Student group'}
            >
              <span className="workflow-step-num">3</span>
              <span>+ {t('group')}</span>
            </button>
          </div>
        </div>

        <div className="action-panel-bulk">
          <span className="panel-section-title" lang="el">
            {language === 'el' ? toGreekUppercase('2. Μαζικά εργαλεία') : '2. Bulk utilities'}
          </span>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="outline import-csv-btn dashboard-import-btn"
          >
            <span>📥</span>
            <span>{t('importCsv')}</span>
          </button>
        </div>
      </div>

      <ResourceSection title={t('courses')} items={courses.map(x => x.name)} />
      <ResourceSection title={t('periods')} items={periods.map(x => x.name)} />
      <ResourceSection title={t('groups')} items={groups.map(x => x.title)} />

      <StudentManager groups={groups} onOpenImport={() => setShowImport(true)} onStudentsChanged={onStudentsChanged} />
      <HierarchyView periods={periods} courses={courses} groups={groups} refreshKey={studentVersion} />

      <h2>{t('sessions')}</h2>
      <div className="grid">
        {sessions.length ? (
          sessions.map(s => (
            <Link className="card session" to={`/session/${s.id}`} key={s.id}>
              <span className={`pill ${s.status.toLowerCase()}`} lang="el">{toGreekUppercase(translateStatus(s.status, t))}</span>
              <h3>{s.title || `${t('session')} ${s.session_date}`}</h3>
              <p>{s.is_demo ? 'DEMO · ' : ''}{s.session_date}</p>
            </Link>
          ))
        ) : (
          <p>{t('noItems')}</p>
        )}
      </div>

      {form && (
        <ResourceForm
          kind={form}
          courses={courses}
          periods={periods}
          groups={groups}
          close={() => setForm(null)}
          saved={saved}
          failed={e => setErr(translateError(e, language))}
        />
      )}

      {showImport && (
        <CsvImportModal
          groups={groups}
          close={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            setNotice(t('actionDone'));
            onStudentsChanged();
            reload();
          }}
        />
      )}
    </Layout>
  );
}
