import React from 'react';
import { useT } from '../../../context/LocaleContext';
import { AdminRemovalStudentRow } from './AdminRemovalStudentRow';

interface AdminRemovalStudentsAccordionProps {
  courses: any[];
  groups: any[];
  students: any[];
  expandedCourses: Record<string, boolean>;
  expandedGroups: Record<string, boolean>;
  toggleCourse: (id: string | number) => void;
  toggleGroup: (id: string | number) => void;
  setEditingGroupId: (id: number | null) => void;
  setEditGroupTitle: (val: string) => void;
  setEditGroupDate: (val: string) => void;
  setEditGroupCourseId: (val: string) => void;
  editingStudentId: number | null;
  setEditingStudentId: (id: number | null) => void;
  editStudentName: string;
  setEditStudentName: (val: string) => void;
  editStudentTitle: string;
  setEditStudentTitle: (val: string) => void;
  onSaveStudent: (id: number) => void;
  busySaving: boolean;
  onSetConfirmModal: (modal: any) => void;
  renderLecturerBadge: (item: any) => React.ReactNode;
}

export function AdminRemovalStudentsAccordion({
  courses,
  groups,
  students,
  expandedCourses,
  expandedGroups,
  toggleCourse,
  toggleGroup,
  setEditingGroupId,
  setEditGroupTitle,
  setEditGroupDate,
  setEditGroupCourseId,
  editingStudentId,
  setEditingStudentId,
  editStudentName,
  setEditStudentName,
  editStudentTitle,
  setEditStudentTitle,
  onSaveStudent,
  busySaving,
  onSetConfirmModal,
  renderLecturerBadge
}: AdminRemovalStudentsAccordionProps) {
  const { t, language } = useT();

  return (
    <section style={{ margin: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h3>👥 {t('students')} ({students.length})</h3>
          <p style={{ margin: 0, fontSize: '.85rem', color: '#64748b' }}>
            {language === 'el'
              ? 'Ιεραρχική δομή: Μάθημα ➔ Ομάδα ➔ Φοιτητές με αναγνώριση διδάσκοντα και απευθείας επεξεργασία.'
              : 'Hierarchical accordion: Course ➔ Group ➔ Students with lecturer attribution and inline editing.'}
          </p>
        </div>
      </div>

      {courses.length === 0 && students.length === 0 ? (
        <p>{t('noItems')}</p>
      ) : (
        <div className="admin-students-hierarchy">
          {courses.map(crs => {
            const crsGroups = groups.filter(g => g.course_id === crs.id);
            const crsGroupIds = new Set(crsGroups.map(g => g.id));
            const crsStudents = students.filter(s => crsGroupIds.has(s.group_id));
            const isCourseExpanded = expandedCourses[crs.id] ?? true;

            return (
              <div className={`admin-accordion-course ${isCourseExpanded ? 'open' : ''}`} key={crs.id}>
                {/* Course Accordion Header */}
                <div
                  className="admin-accordion-course-header"
                  onClick={() => toggleCourse(crs.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isCourseExpanded}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{isCourseExpanded ? '▼' : '▶'}</span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>📚 {crs.name}</span>
                    <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#334155', padding: '0.15rem 0.5rem', borderRadius: 99, fontWeight: 700 }}>
                      {crsStudents.length} {crsStudents.length === 1 ? (language === 'el' ? 'φοιτητής' : 'student') : (language === 'el' ? 'φοιτητές' : 'students')}
                    </span>
                    {renderLecturerBadge(crs)}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {crsGroups.length} {crsGroups.length === 1 ? (language === 'el' ? 'ομάδα' : 'group') : (language === 'el' ? 'ομάδες' : 'groups')}
                  </span>
                </div>

                {/* Course Body (Groups Accordions) */}
                {isCourseExpanded && (
                  <div style={{ padding: '0.35rem 0' }}>
                    {crsGroups.length === 0 ? (
                      <p style={{ margin: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.86rem', fontStyle: 'italic' }}>
                        {language === 'el' ? 'Δεν υπάρχουν ομάδες σε αυτό το μάθημα.' : 'No groups in this course yet.'}
                      </p>
                    ) : (
                      crsGroups.map(grp => {
                        const grpStudents = students.filter(s => s.group_id === grp.id);
                        const isGroupExpanded = expandedGroups[grp.id] ?? true;

                        return (
                          <div className={`admin-accordion-group ${isGroupExpanded ? 'open' : ''}`} key={grp.id}>
                            {/* Group Header */}
                            <div
                              className="admin-accordion-group-header"
                              onClick={() => toggleGroup(grp.id)}
                              role="button"
                              tabIndex={0}
                              aria-expanded={isGroupExpanded}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{isGroupExpanded ? '▼' : '▶'}</span>
                                <span style={{ fontWeight: 750, fontSize: '0.92rem', color: '#1e293b' }}>👥 {grp.title}</span>
                                {grp.presentation_date && (
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>· {grp.presentation_date}</span>
                                )}
                                <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '0.1rem 0.45rem', borderRadius: 99, fontWeight: 700 }}>
                                  {grpStudents.length}
                                </span>
                                {renderLecturerBadge(grp)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn-inline-edit"
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', minHeight: 26 }}
                                  onClick={() => {
                                    setEditingGroupId(grp.id);
                                    setEditGroupTitle(grp.title || '');
                                    setEditGroupDate(grp.presentation_date || '');
                                    setEditGroupCourseId(grp.course_id ? String(grp.course_id) : '');
                                  }}
                                  title={t('edit')}
                                >
                                  ✏️ {t('edit')}
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', minHeight: 26 }}
                                  onClick={() => onSetConfirmModal({ path: `/groups/${grp.id}`, label: grp.title, verb: 'delete', isGroup: true })}
                                  title={t('delete')}
                                >
                                  🗑️ {t('delete')}
                                </button>
                              </div>
                            </div>

                            {/* Group Students List */}
                            {isGroupExpanded && (
                              <div className="admin-accordion-students-list">
                                {grpStudents.length === 0 ? (
                                  <p style={{ margin: '0.4rem 0.5rem', color: '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic' }}>
                                    {language === 'el' ? 'Δεν υπάρχουν ακόμη φοιτητές σε αυτή την ομάδα.' : 'No students in this group yet.'}
                                  </p>
                                ) : (
                                  grpStudents.map(std => (
                                    <AdminRemovalStudentRow
                                      key={std.id}
                                      std={std}
                                      isEditing={editingStudentId === std.id}
                                      editStudentName={editStudentName}
                                      setEditStudentName={setEditStudentName}
                                      editStudentTitle={editStudentTitle}
                                      setEditStudentTitle={setEditStudentTitle}
                                      onSaveStudent={onSaveStudent}
                                      onCancelEdit={() => setEditingStudentId(null)}
                                      onStartEdit={() => {
                                        setEditingStudentId(std.id);
                                        setEditStudentName(std.full_name || '');
                                        setEditStudentTitle(std.presentation_title || '');
                                      }}
                                      onDelete={() => onSetConfirmModal({ path: `/students/${std.id}`, label: std.full_name, verb: 'delete' })}
                                      busySaving={busySaving}
                                      renderLecturerBadge={renderLecturerBadge}
                                    />
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
