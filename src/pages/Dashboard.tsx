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
import { PollsDashboardContainer } from '../components/dashboard/PollsDashboardContainer';
import { ModeSelectionModal } from '../components/dashboard/ModeSelectionModal';
import { DashboardStatsBar, DashboardTab } from '../components/dashboard/DashboardStatsBar';

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
  const [showModeModal, setShowModeModal] = React.useState(false);
  const [showCreatePoll, setShowCreatePoll] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('live');
  const [pollsCount, setPollsCount] = React.useState(0);

  const showLive = activeTab === 'live' || activeTab === 'all';
  const showStructure = activeTab === 'structure' || activeTab === 'all';
  const showArchive = activeTab === 'archive' || activeTab === 'all';

  return (
    <Layout>
      <div className="title-row">
        <h1>{t('dashboard')}</h1>
        <div className="actions">
          {activeOrUnarchived && enableSampleFixtureButton && (
            <a
              href={`/join/${activeOrUnarchived.public_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-student-phone-preview"
              title={language === 'el' ? 'Προβολή της οθόνης φοιτητή στο κινητό σε νέα καρτέλα' : 'Open student phone view in new tab'}
            >
              <span>📱</span>
              <span>{t('studentPhoneDemo')}</span>
            </a>
          )}
          <button
            type="button"
            className="btn-create-session"
            onClick={() => setShowModeModal(true)}
            style={{ background: 'linear-gradient(135deg, #0d9488, #2563eb)', color: '#ffffff', fontWeight: 800, padding: '0.55rem 1.25rem' }}
          >
            <span>✨</span>
            <span>{language === 'el' ? '+ Νέα Συνεδρία / Quiz' : '+ New Session / Quiz'}</span>
          </button>
        </div>
      </div>

      {err && <p className="error" role="alert">{err}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}

      <DashboardStatsBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        coursesCount={courses.length}
        periodsCount={periods.length}
        groupsCount={groups.length}
        waitingCount={waitingSessions.length}
        pollsCount={pollsCount}
        archivedCount={archivedSessions.length}
        hasActiveSession={Boolean(activeOrUnarchived)}
      />

      {showLive && activeOrUnarchived && (
        <ActiveSessionBanner session={activeOrUnarchived} enableDemo={enableSampleFixtureButton} />
      )}

      {showLive && (
        <WaitingSessionsSection
          sessions={waitingSessions}
          onAddSession={() => open('session')}
          onActivate={handleActivateSession}
          onEdit={id => setEditingSessionId(id)}
          onDelete={s => setDeleteTarget({ path: `/sessions/${s.id}`, label: s.title || s.session_date, type: t('session') })}
        />
      )}

      <div style={{ display: showLive ? 'block' : 'none' }}>
        <PollsDashboardContainer
          courses={courses}
          periods={periods}
          onNotice={setNotice}
          showCreateModal={showCreatePoll}
          onCloseCreateModal={() => setShowCreatePoll(false)}
          onPollsLoaded={setPollsCount}
        />
      </div>

      {showStructure && (
        <>
          <WorkflowBar
            onOpen={open} onOpenImport={() => setShowImport(true)}
            onLoadSampleFixture={handleLoadSampleFixture} enableSampleFixtureButton={enableSampleFixtureButton}
          />
          <CoursesListSection
            courses={courses} periods={periods}
            editingCourseId={editingCourseId} editCourseName={editCourseName} editCourseDesc={editCourseDesc} editCoursePeriodId={editCoursePeriodId}
            busySaving={busySaving} setEditingCourseId={setEditingCourseId} setEditCourseName={setEditCourseName} setEditCourseDesc={setEditCourseDesc}
            setEditCoursePeriodId={setEditCoursePeriodId} onSaveCourse={handleSaveCourse} onDeleteTarget={setDeleteTarget}
          />
          <PeriodsListSection
            periods={periods} editingPeriodId={editingPeriodId} editPeriodName={editPeriodName}
            busySaving={busySaving} setEditingPeriodId={setEditingPeriodId} setEditPeriodName={setEditPeriodName}
            onSavePeriod={handleSavePeriod} onDeleteTarget={setDeleteTarget}
          />
          <GroupsListSection
            groups={groups} courses={courses}
            editingGroupId={editingGroupId} editGroupTitle={editGroupTitle} editGroupDate={editGroupDate} editGroupCourseId={editGroupCourseId}
            busySaving={busySaving} setEditingGroupId={setEditingGroupId} setEditGroupTitle={setEditGroupTitle} setEditGroupDate={setEditGroupDate}
            setEditGroupCourseId={setEditGroupCourseId} onSaveGroup={handleSaveGroup} onDeleteTarget={setDeleteTarget}
          />
          <StudentManager groups={groups} onOpenImport={() => setShowImport(true)} onStudentsChanged={() => setStudentVersion(v => v + 1)} />
          <HierarchyView periods={periods} courses={courses} groups={groups} refreshKey={studentVersion} />
        </>
      )}

      {showArchive && (
        <ArchivedSessionsSection
          sessions={archivedSessions}
          onDelete={s => setDeleteTarget({ path: `/sessions/${s.id}`, label: s.title || s.session_date, type: t('archived') })}
        />
      )}

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

      {showModeModal && (
        <ModeSelectionModal
          onClose={() => setShowModeModal(false)}
          onChoosePresentationVoting={() => {
            setShowModeModal(false);
            open('session');
          }}
          onChooseQuizPoll={() => {
            setShowModeModal(false);
            setShowCreatePoll(true);
          }}
        />
      )}
    </Layout>
  );
}
