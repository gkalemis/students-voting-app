import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';

export function useAdminRemovalState() {
  const { t, language } = useT();
  const [courses, setCourses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ path: string; label: string; verb: 'delete' | 'archive'; isGroup?: boolean } | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Inline editing states
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCoursePeriodId, setEditCoursePeriodId] = useState<string>('');
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [editPeriodName, setEditPeriodName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupTitle, setEditGroupTitle] = useState('');
  const [editGroupDate, setEditGroupDate] = useState('');
  const [editGroupCourseId, setEditGroupCourseId] = useState<string>('');
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentTitle, setEditStudentTitle] = useState('');
  const [busySaving, setBusySaving] = useState(false);

  // Accordion state
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleCourse = (courseId: number | string) => setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  const toggleGroup = (groupId: number | string) => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));

  const load = () =>
    Promise.all([api('/courses'), api('/periods'), api('/groups'), api('/groups/students'), api('/sessions')])
      .then(([a, b, c, s, d]) => {
        setCourses(a);
        setPeriods(b);
        setGroups(c);
        setStudents(s);
        setSessions(d);

        setExpandedCourses(prev => {
          const next = { ...prev };
          a.forEach((crs: any) => {
            if (next[crs.id] === undefined) next[crs.id] = true;
          });
          return next;
        });

        setExpandedGroups(prev => {
          const next = { ...prev };
          c.forEach((grp: any) => {
            if (next[grp.id] === undefined) next[grp.id] = true;
          });
          return next;
        });
      })
      .catch(e => setError(translateError(e, language)));

  useEffect(() => {
    load();
  }, [language]);

  const handleSaveCourse = async (id: number) => {
    if (!editCourseName.trim()) return;
    setBusySaving(true);
    setError('');
    try {
      await api(`/courses/${id}`, json('PATCH', {
        name: editCourseName.trim(),
        description: editCourseDesc.trim() || null,
        period_id: editCoursePeriodId ? Number(editCoursePeriodId) : null
      }));
      setEditingCourseId(null);
      setMessage(t('saved'));
      load();
    } catch (e) {
      setError(translateError(e, language));
    } finally {
      setBusySaving(false);
    }
  };

  const handleSavePeriod = async (id: number) => {
    if (!editPeriodName.trim()) return;
    setBusySaving(true);
    setError('');
    try {
      await api(`/periods/${id}`, json('PATCH', { name: editPeriodName.trim() }));
      setEditingPeriodId(null);
      setMessage(t('saved'));
      load();
    } catch (e) {
      setError(translateError(e, language));
    } finally {
      setBusySaving(false);
    }
  };

  const handleSaveGroup = async (id: number) => {
    if (!editGroupTitle.trim()) return;
    setBusySaving(true);
    setError('');
    try {
      await api(`/groups/${id}`, json('PATCH', {
        title: editGroupTitle.trim(),
        presentation_date: editGroupDate || null,
        course_id: editGroupCourseId ? Number(editGroupCourseId) : undefined
      }));
      setEditingGroupId(null);
      setMessage(t('saved'));
      load();
    } catch (e) {
      setError(translateError(e, language));
    } finally {
      setBusySaving(false);
    }
  };

  const handleSaveStudent = async (id: number) => {
    if (!editStudentName.trim()) return;
    setBusySaving(true);
    setError('');
    try {
      await api(`/students/${id}`, json('PATCH', {
        full_name: editStudentName.trim(),
        presentation_title: editStudentTitle.trim() || null
      }));
      setEditingStudentId(null);
      setMessage(t('saved'));
      load();
    } catch (e) {
      setError(translateError(e, language));
    } finally {
      setBusySaving(false);
    }
  };

  const executeRemove = async () => {
    if (!confirmModal) return;
    setBusyAction(true);
    setError('');
    try {
      if (confirmModal.verb === 'archive') {
        await api(confirmModal.path, json('POST', {}));
        setMessage(t('sessionArchived'));
      } else {
        await api(confirmModal.path, json('DELETE'));
        setMessage(t('deleted'));
      }
      setConfirmModal(null);
      load();
    } catch (e) {
      setError(translateError(e, language));
    } finally {
      setBusyAction(false);
    }
  };

  const renderLecturerBadge = (item: any) => {
    const ownerName = item.owner_name || item.lecturer_name;
    if (!ownerName) return null;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.74rem',
          color: '#0d9488',
          background: '#f0fdfa',
          border: '1px solid #ccfbf1',
          padding: '0.1rem 0.45rem',
          borderRadius: 99,
          fontWeight: 650
        }}
        title={language === 'el' ? `Διδάσκων / Δημιουργός: ${ownerName}` : `Lecturer / Creator: ${ownerName}`}
      >
        <span>👨‍🏫</span>
        <span>{ownerName}</span>
      </span>
    );
  };

  return {
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
  };
}
