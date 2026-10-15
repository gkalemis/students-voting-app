import React from 'react';
import { useAdminRemovalState } from '../hooks/useAdminRemovalState';
import { AdminRemovalConfirmModal } from './admin/removal/AdminRemovalConfirmModal';
import { AdminRemovalCoursesSection } from './admin/removal/AdminRemovalCoursesSection';
import { AdminRemovalPeriodsSection } from './admin/removal/AdminRemovalPeriodsSection';
import { AdminRemovalGroupsSection } from './admin/removal/AdminRemovalGroupsSection';
import { AdminRemovalStudentsAccordion } from './admin/removal/AdminRemovalStudentsAccordion';
import { AdminRemovalSessionsSection } from './admin/removal/AdminRemovalSessionsSection';

export function AdminRemovalPanel({
  users: _users, reloadUsers: _reloadUsers
}: {
  users?: any[];
  reloadUsers?: () => void;
}) {
  const {
    t,
    language,
    courses,
    periods,
    groups,
    students,
    sessions,
    confirmModal,
    setConfirmModal,
    busyAction,
    message,
    error,
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
    editingStudentId,
    setEditingStudentId,
    editStudentName,
    setEditStudentName,
    editStudentTitle,
    setEditStudentTitle,
    busySaving,
    expandedCourses,
    expandedGroups,
    toggleCourse,
    toggleGroup,
    handleSaveCourse,
    handleSavePeriod,
    handleSaveGroup,
    handleSaveStudent,
    executeRemove,
    renderLecturerBadge
  } = useAdminRemovalState();

  return (
    <section style={{ margin: '2rem 0' }}>
      <h2>{t('removeManagement')}</h2>
      <p style={{ color: '#64748b', fontSize: '.9rem', margin: '0 0 1rem 0' }}>
        {language === 'el'
          ? 'Πλήρης διαχείριση, απευθείας επεξεργασία (inline) και διαγραφή μαθημάτων, περιόδων, ομάδων και φοιτητών με επισήμανση διδάσκοντα.'
          : 'Full management, inline editing, and deletion of courses, periods, groups, and students with lecturer attribution.'}
      </p>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="notice" role="status">{message}</p>}

      <AdminRemovalCoursesSection
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
        onSetConfirmModal={setConfirmModal}
        renderLecturerBadge={renderLecturerBadge}
      />

      <AdminRemovalPeriodsSection
        periods={periods}
        editingPeriodId={editingPeriodId}
        editPeriodName={editPeriodName}
        busySaving={busySaving}
        setEditingPeriodId={setEditingPeriodId}
        setEditPeriodName={setEditPeriodName}
        onSavePeriod={handleSavePeriod}
        onSetConfirmModal={setConfirmModal}
        renderLecturerBadge={renderLecturerBadge}
      />

      <AdminRemovalGroupsSection
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
        onSetConfirmModal={setConfirmModal}
        renderLecturerBadge={renderLecturerBadge}
      />

      <AdminRemovalStudentsAccordion
        courses={courses}
        groups={groups}
        students={students}
        expandedCourses={expandedCourses}
        expandedGroups={expandedGroups}
        toggleCourse={toggleCourse}
        toggleGroup={toggleGroup}
        setEditingGroupId={setEditingGroupId}
        setEditGroupTitle={setEditGroupTitle}
        setEditGroupDate={setEditGroupDate}
        setEditGroupCourseId={setEditGroupCourseId}
        editingStudentId={editingStudentId}
        setEditingStudentId={setEditingStudentId}
        editStudentName={editStudentName}
        setEditStudentName={setEditStudentName}
        editStudentTitle={editStudentTitle}
        setEditStudentTitle={setEditStudentTitle}
        onSaveStudent={handleSaveStudent}
        busySaving={busySaving}
        onSetConfirmModal={setConfirmModal}
        renderLecturerBadge={renderLecturerBadge}
      />

      <AdminRemovalSessionsSection
        sessions={sessions}
        onSetConfirmModal={setConfirmModal}
        renderLecturerBadge={renderLecturerBadge}
      />

      {confirmModal && (
        <AdminRemovalConfirmModal
          confirmModal={confirmModal}
          busyAction={busyAction}
          onConfirm={executeRemove}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </section>
  );
}
