import React from 'react';
import { useDashboardState } from '../hooks/useDashboardState';
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
import { CoursesListSection } from '../components/dashboard/CoursesListSection';
import { PeriodsListSection } from '../components/dashboard/PeriodsListSection';
import { GroupsListSection } from '../components/dashboard/GroupsListSection';

export function Dashboard() {
  const {
    t,
    language,
    courses,
    periods,
    groups,
    form,
    setForm,
    showImport,
    setShowImport,
    editingSessionId,
    setEditingSessionId,
    studentVersion,
    setStudentVersion,
    err,
    setErr,
    notice,
    setNotice,
    concurrencyLock,
    setConcurrencyLock,
    deleteTarget,
    setDeleteTarget,
    editingCourseId,
    setEditingCourseId,
    editCourseName,
    setEditCourseName,
    editCourseDesc,
    setEditCourseDesc,
    editCoursePeriodId,
    setEditCoursePeriodId,
    editingPeriodId,
    setEditingPeriodId,
    editPeriodName,
    setEditPeriodName,
    editingGroupId,
    setEditingGroupId,
    editGroupTitle,
    setEditGroupTitle,
    editGroupDate,
    setEditGroupDate,
    editGroupCourseId,
    setEditGroupCourseId,
    busySaving,
    reload,
    open,
    handleActivateSession,
    handleExecuteDelete,
    handleSaveCourse,
    handleSavePeriod,
    handleSaveGroup,
    handleLoadSampleFixture,
    activeOrUnarchived,
    waitingSessions,
    archivedSessions,
    enableSampleFixtureButton,
    translateError
  } = useDashboardState();

  return (
    <Layout>
      <div className="title-row">
        <h1>{t('dashboard')}</h1>
        <div className="actions">
          {activeOrUnarchived && enableSampleFixtureButton && (
            <button
              type="button"
              className="btn-student-phone-preview"
              onClick={() => window.open(`/join/${activeOrUnarchived.public_id}`, '_blank', 'noopener,noreferrer')}
              title={language === 'el' ? 'Προβολή της οθόνης φοιτητή στο κινητό σε νέα καρτέλα' : 'Open student phone view in new tab'}
            >
              <span>📱</span>
              <span>{language === 'el' ? 'Προβολή Κινητού (Demo)' : 'Student Phone View (Demo)'}</span>
            </button>
          )}
          <button type="button" className="btn-create-session" onClick={() => open('session')}>
            <span>🚀</span>
            <span>+ {t('session')}</span>
          </button>
        </div>
      </div>

      {err && <p className="error" role="alert">{err}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}

      {/* Unified Command Center Quick Stats Bar */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', margin: '0.75rem 0 1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>{t('courses')}</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{courses.length}</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>{t('periods')}</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{periods.length}</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>{t('groups')}</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{groups.length}</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>{t('waitingSessions')}</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{waitingSessions.length}</div>
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
          🏛️ {language === 'el' ? 'Κέντρο Διοίκησης Μαθημάτων' : 'Academic Command Hub'}
        </div>
      </div>

      {activeOrUnarchived && <ActiveSessionBanner session={activeOrUnarchived} enableDemo={enableSampleFixtureButton} />}

      <WorkflowBar
        onOpen={open}
        onOpenImport={() => setShowImport(true)}
        onLoadSampleFixture={handleLoadSampleFixture}
        enableSampleFixtureButton={enableSampleFixtureButton}
      />

      <CoursesListSection
        courses={courses}
        periods={periods}
        editingCourseId={editingCourseId}
        editCourseName={editCourseName}
        editCourseDesc={editCourseDesc}
        editCoursePeriodId={editCoursePeriodId}
        busySaving={busySaving}
        setEditingCourseId={setEditingCourseId}
        setEditCourseName={setEditCourseName}
        setEditCourseDesc={setEditCourseDesc}
        setEditCoursePeriodId={setEditCoursePeriodId}
        onSaveCourse={handleSaveCourse}
        onDeleteTarget={setDeleteTarget}
      />

      <PeriodsListSection
        periods={periods}
        editingPeriodId={editingPeriodId}
        editPeriodName={editPeriodName}
        busySaving={busySaving}
        setEditingPeriodId={setEditingPeriodId}
        setEditPeriodName={setEditPeriodName}
        onSavePeriod={handleSavePeriod}
        onDeleteTarget={setDeleteTarget}
      />

      <GroupsListSection
        groups={groups}
        courses={courses}
        editingGroupId={editingGroupId}
        editGroupTitle={editGroupTitle}
        editGroupDate={editGroupDate}
        editGroupCourseId={editGroupCourseId}
        busySaving={busySaving}
        setEditingGroupId={setEditingGroupId}
        setEditGroupTitle={setEditGroupTitle}
        setEditGroupDate={setEditGroupDate}
        setEditGroupCourseId={setEditGroupCourseId}
        onSaveGroup={handleSaveGroup}
        onDeleteTarget={setDeleteTarget}
      />

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
          onSuccess={() => { setShowImport(false); setNotice(t('csvSuccessSummary')); setStudentVersion(v => v + 1); reload(); }}
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
