import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { FormKind, SessionItem } from '../types';

export function useDashboardState() {
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
  const [notice, setNoticeState] = useState('');
  const noticeTimerRef = useRef<any>(null);

  const setNotice = (msg: string) => {
    setNoticeState(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    if (msg) {
      noticeTimerRef.current = setTimeout(() => {
        setNoticeState('');
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const [concurrencyLock, setConcurrencyLock] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ path: string; label: string; type: string } | null>(null);
  const [enableSampleFixtureButton, setEnableSampleFixtureButton] = useState(true);

  useEffect(() => {
    api('/public/branding')
      .then((data: any) => {
        if (data && typeof data.enable_sample_fixture_button === 'boolean') {
          setEnableSampleFixtureButton(data.enable_sample_fixture_button);
        }
      })
      .catch(() => {});
  }, []);

  // Inline editing state for courses, periods, groups
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
  const [busySaving, setBusySaving] = useState(false);

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
      if (e?.status === 409 && e?.active_session) {
        setConcurrencyLock(e.active_session);
      } else {
        setErr(translateError(e, language));
      }
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setErr('');
    setNotice('');
    try {
      await api(deleteTarget.path, json('DELETE'));
      setNotice(t('deleted'));
      setDeleteTarget(null);
      reload();
    } catch (e) {
      setErr(translateError(e, language));
    }
  };

  const handleSaveCourse = async (id: number) => {
    if (!editCourseName.trim()) return;
    setBusySaving(true);
    setErr('');
    try {
      await api(`/courses/${id}`, json('PATCH', {
        name: editCourseName.trim(),
        description: editCourseDesc.trim() || null,
        period_id: editCoursePeriodId ? Number(editCoursePeriodId) : null
      }));
      setEditingCourseId(null);
      setNotice(t('saved'));
      reload();
    } catch (e) {
      setErr(translateError(e, language));
    } finally {
      setBusySaving(false);
    }
  };

  const handleSavePeriod = async (id: number) => {
    if (!editPeriodName.trim()) return;
    setBusySaving(true);
    setErr('');
    try {
      await api(`/periods/${id}`, json('PATCH', {
        name: editPeriodName.trim()
      }));
      setEditingPeriodId(null);
      setNotice(t('saved'));
      reload();
    } catch (e) {
      setErr(translateError(e, language));
    } finally {
      setBusySaving(false);
    }
  };

  const handleLoadSampleFixture = async () => {
    setErr('');
    setNotice('');
    try {
      await api('/import/sample-fixture', json('POST', {}));
      setNotice(t('sampleFixtureLoaded'));
      reload();
      setStudentVersion(v => v + 1);
    } catch (e) {
      setErr(translateError(e, language));
    }
  };

  const handleSaveGroup = async (id: number) => {
    if (!editGroupTitle.trim()) return;
    setBusySaving(true);
    setErr('');
    try {
      await api(`/groups/${id}`, json('PATCH', {
        title: editGroupTitle.trim(),
        presentation_date: editGroupDate || null,
        course_id: editGroupCourseId ? Number(editGroupCourseId) : undefined
      }));
      setEditingGroupId(null);
      setNotice(t('saved'));
      reload();
    } catch (e) {
      setErr(translateError(e, language));
    } finally {
      setBusySaving(false);
    }
  };

  const activeOrUnarchived = sessions.find(x => x.status === 'ACTIVE' || x.status === 'COMPLETED');
  const waitingSessions = sessions.filter(x => x.status === 'WAITING' || x.status === 'DRAFT');
  const archivedSessions = sessions.filter(x => x.status === 'ARCHIVED');

  return {
    t,
    language,
    courses,
    periods,
    groups, sessions, form, setForm, showImport, setShowImport,
    editingSessionId, setEditingSessionId, studentVersion, setStudentVersion,
    err, setErr, notice, setNotice, concurrencyLock, setConcurrencyLock,
    deleteTarget, setDeleteTarget,
    editingCourseId, setEditingCourseId, editCourseName, setEditCourseName, editCourseDesc, setEditCourseDesc, editCoursePeriodId, setEditCoursePeriodId,
    editingPeriodId, setEditingPeriodId, editPeriodName, setEditPeriodName,
    editingGroupId, setEditingGroupId, editGroupTitle, setEditGroupTitle, editGroupDate, setEditGroupDate, editGroupCourseId, setEditGroupCourseId,
    busySaving, reload, open,
    handleActivateSession, handleExecuteDelete,
    handleSaveCourse, handleSavePeriod, handleSaveGroup,
    handleLoadSampleFixture,
    activeOrUnarchived, waitingSessions, archivedSessions,
    enableSampleFixtureButton, translateError
  };
}
