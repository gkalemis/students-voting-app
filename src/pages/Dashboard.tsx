import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { FormKind, SessionItem } from '../types';
import { Layout } from '../components/Layout';
import { ResourceForm } from '../components/ResourceForm';
import { StudentManager } from '../components/StudentManager';
import { HierarchyView } from '../components/HierarchyView';
import { CsvImportModal } from '../components/CsvImportModal';
import { SessionEditorModal } from '../components/SessionEditorModal';
import { ActiveSessionBanner } from '../components/dashboard/ActiveSessionBanner';
import { WorkflowBar } from '../components/dashboard/WorkflowBar';
import { WaitingSessionsSection } from '../components/dashboard/WaitingSessionsSection';
import { ArchivedSessionsSection } from '../components/dashboard/ArchivedSessionsSection';
import { DashboardDeleteModal } from '../components/dashboard/DashboardDeleteModal';
import { ConcurrencyLockModal } from '../components/dashboard/ConcurrencyLockModal';

export function Dashboard() {
  const { t, language } = useT();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [form, setForm] = useState<FormKind>(null);
  const [showImport, setShowImport] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [studentVersion, setStudentVersion] = useState(0);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [concurrencyLock, setConcurrencyLock] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ path: string; label: string; type: string } | null>(null);

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

  const handleActivateSession = async (sessionId: number) => {
    setErr('');
    setNotice('');
    try {
      await api(`/sessions/${sessionId}/activate`, json('POST'));
      setNotice(language === 'el' ? 'Η συνεδρία ενεργοποιήθηκε επιτυχώς!' : 'Session activated successfully!');
      reload();
      navigate(`/session/${sessionId}`);
    } catch (e: any) {
      if (e?.error === 'SESSION_CONCURRENCY_LOCK' || e?.status === 409) {
        setConcurrencyLock(e);
      } else {
        setErr(translateError(e, language));
      }
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setErr('');
    try {
      await api(deleteTarget.path, json('DELETE'));
      setNotice(t('actionDone'));
      setDeleteTarget(null);
      reload();
    } catch (e: any) {
      setErr(translateError(e, language));
      setDeleteTarget(null);
    }
  };

  const activeOrUnarchived = sessions.find(s => s.status === 'ACTIVE' || s.status === 'COMPLETED');
  const waitingSessions = sessions.filter(s => s.status === 'WAITING' || s.status === 'DRAFT');
  const archivedSessions = sessions.filter(s => s.status === 'ARCHIVED');

  return (
    <Layout>
      <div className="dashboard-header-bar">
        <div>
          <h1>{t('lecturerDashboard')}</h1>
          <p className="dashboard-subtitle">
            {language === 'el'
              ? 'Διαχείριση μαθημάτων, ομάδων και συνεδριών ψηφοφορίας'
              : 'Management of courses, student groups, and voting sessions'}
          </p>
        </div>
        <div className="dashboard-main-cta">
          <button type="button" className="btn-create-session" onClick={() => open('session')}>
            <span>🚀</span>
            <span>+ {t('session')}</span>
          </button>
        </div>
      </div>

      {err && <p className="error" role="alert">{err}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}

      {activeOrUnarchived && <ActiveSessionBanner session={activeOrUnarchived} />}

      <WorkflowBar onOpen={open} onOpenImport={() => setShowImport(true)} />

      {/* Academic Periods & Courses & Groups Resource Lists */}
      <section style={{ margin: '1.5rem 0' }}>
        <h2>{t('periods')}</h2>
        {periods.length ? (
          <div className="list">
            {periods.map(p => (
              <div className="card row" key={p.id}>
                <div>
                  <b style={{ fontSize: '1rem', color: '#0f172a' }}>{p.name}</b>
                </div>
                <button
                  type="button"
                  className="danger outline"
                  style={{ fontSize: '.82rem', padding: '.25rem .55rem' }}
                  onClick={() => setDeleteTarget({ path: `/periods/${p.id}`, label: p.name, type: t('period') })}
                >
                  🗑️ {t('delete')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>{t('noItems')}</p>
        )}
      </section>

      <section style={{ margin: '1.5rem 0' }}>
        <h2>{t('courses')}</h2>
        {courses.length ? (
          <div className="list">
            {courses.map(c => (
              <div className="card row" key={c.id}>
                <div>
                  <b style={{ fontSize: '1rem', color: '#0f172a' }}>{c.name}</b>
                  {c.description && <span style={{ color: '#64748b', fontSize: '.88rem', marginLeft: '.6rem' }}>({c.description})</span>}
                </div>
                <button
                  type="button"
                  className="danger outline"
                  style={{ fontSize: '.82rem', padding: '.25rem .55rem' }}
                  onClick={() => setDeleteTarget({ path: `/courses/${c.id}`, label: c.name, type: t('course') })}
                >
                  🗑️ {t('delete')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>{t('noItems')}</p>
        )}
      </section>

      <section style={{ margin: '1.5rem 0' }}>
        <h2>{t('groups')}</h2>
        {groups.length ? (
          <div className="list">
            {groups.map(g => {
              const crs = courses.find(c => c.id === g.course_id);
              return (
                <div className="card row" key={g.id}>
                  <div>
                    <b style={{ fontSize: '1rem', color: '#0f172a' }}>{g.title}</b>
                    {crs && <span style={{ color: '#475569', fontSize: '.88rem', marginLeft: '.6rem' }}>[{crs.name}]</span>}
                    {g.presentation_date && <span style={{ color: '#64748b', fontSize: '.85rem', marginLeft: '.5rem' }}>· {g.presentation_date}</span>}
                  </div>
                  <button
                    type="button"
                    className="danger outline"
                    style={{ fontSize: '.82rem', padding: '.25rem .55rem' }}
                    onClick={() => setDeleteTarget({ path: `/groups/${g.id}`, label: g.title, type: t('group') })}
                  >
                    🗑️ {t('delete')}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p>{t('noItems')}</p>
        )}
      </section>

      <StudentManager groups={groups} onOpenImport={() => setShowImport(true)} onStudentsChanged={() => setStudentVersion(v => v + 1)} />
      <HierarchyView periods={periods} courses={courses} groups={groups} refreshKey={studentVersion} />

      <WaitingSessionsSection
        sessions={waitingSessions}
        onAddSession={() => open('session')}
        onActivate={handleActivateSession}
        onEdit={id => setEditingSessionId(id)}
        onDelete={s => setDeleteTarget({ path: `/sessions/${s.id}`, label: s.title || s.session_date, type: t('session') })}
      />

      <ArchivedSessionsSection
        sessions={archivedSessions}
        onDelete={s => setDeleteTarget({ path: `/sessions/${s.id}`, label: s.title || s.session_date, type: t('archived') })}
      />

      <ConcurrencyLockModal lock={concurrencyLock} onClose={() => setConcurrencyLock(null)} />
      <DashboardDeleteModal target={deleteTarget} onConfirm={handleExecuteDelete} onCancel={() => setDeleteTarget(null)} />

      {form && (
        <ResourceForm
          kind={form}
          courses={courses}
          periods={periods}
          groups={groups}
          close={() => setForm(null)}
          saved={() => { setForm(null); setNotice(t('created')); reload(); }}
          failed={e => setErr(translateError(e, language))}
        />
      )}

      {showImport && (
        <CsvImportModal
          groups={groups}
          close={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); setNotice(t('actionDone')); setStudentVersion(v => v + 1); reload(); }}
        />
      )}

      {editingSessionId !== null && (
        <SessionEditorModal
          sessionId={editingSessionId}
          onClose={() => setEditingSessionId(null)}
          onSaved={() => { setNotice(t('sessionUpdatedSuccess')); reload(); }}
        />
      )}
    </Layout>
  );
}
