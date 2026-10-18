import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { FormKind } from '../types';
import { ResourceFormCriteria } from './ResourceFormCriteria';
import { SessionResourceFields } from './forms/SessionResourceFields';
import { localToday } from '../utils/dates';

interface ResourceFormProps {
  kind: Exclude<FormKind, null>;
  courses: any[];
  periods: any[];
  groups: any[];
  close: () => void;
  saved: () => void;
  failed: (e: unknown) => void;
}

export function ResourceForm({
  kind, courses, periods, groups, close, saved, failed
}: ResourceFormProps) {
  const { t } = useT();
  const [courseId, setCourse] = useState(String(courses[0]?.id || ''));
  const [periodId, setPeriod] = useState(String(periods[0]?.id || ''));
  const [groupId, setGroup] = useState(String(groups[0]?.id || ''));
  const initialGroup = kind === 'session' ? (groups.find(x => String(x.id) === String(groups[0]?.id)) || groups[0]) : null;
  const [date, setDate] = useState(initialGroup?.presentation_date || localToday());
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState('');
  const [name, setName] = useState(kind === 'session' ? (initialGroup?.title || '') : '');
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [sessionCriteria, setSessionCriteria] = useState<{ name: string; weight: number }[]>([
    { name: t('criterionDocumentation'), weight: 40 },
    { name: t('criterionLogicalStructure'), weight: 30 },
    { name: t('criterionPresentation'), weight: 30 }
  ]);

  const headings = {
    course: 'addCourse',
    period: 'addPeriod',
    group: 'addGroup',
    session: 'addSession'
  } as const;

  const filtered = groups.filter(x => String(x.course_id) === courseId && String(x.period_id) === periodId);

  useEffect(() => {
    const matchingCourses = courses.filter(x => String(x.period_id) === periodId);
    if ((kind === 'group' || kind === 'session') && matchingCourses.length && !matchingCourses.some(x => String(x.id) === courseId)) {
      setCourse(String(matchingCourses[0].id));
    }
    if (kind === 'session' && filtered.length && !filtered.some(x => String(x.id) === groupId)) {
      const nextGid = String(filtered[0].id);
      setGroup(nextGid);
      if (!isNameManuallyEdited && filtered[0]?.title) {
        setName(filtered[0].title);
      }
    }
  }, [courseId, periodId]);

  useEffect(() => {
    if (kind === 'session') {
      const current = groups.find(x => String(x.id) === groupId) || filtered[0];
      if (!isNameManuallyEdited && current?.title) {
        setName(current.title);
      }
    }
  }, [kind, groupId, isNameManuallyEdited]);

  useEffect(() => {
    if (kind === 'session') {
      const group = groups.find(x => String(x.id) === groupId);
      setDate(group?.presentation_date || localToday());
    }
  }, [kind, groupId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (kind === 'course') {
        await api('/courses', json('POST', { name, description: description || null }));
      }
      if (kind === 'period') {
        await api('/periods', json('POST', { name }));
      }
      if (kind === 'group') {
        await api('/groups', json('POST', { title: name, course_id: Number(courseId), period_id: Number(periodId), presentation_date: date }));
      }
      if (kind === 'session') {
        const selected = groups.find(x => String(x.id) === groupId);
        const sessionTitle = name.trim() || selected?.title || null;
        const r = await api('/sessions', json('POST', {
          course_id: Number(courseId),
          period_id: Number(periodId),
          group_id: Number(groupId),
          session_date: date,
          title: sessionTitle,
          criteria: sessionCriteria
        }));
        saved();
        return;
      }
      saved();
    } catch (e) {
      failed(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <form
        className="card"
        onSubmit={submit}
        style={{
          maxWidth: kind === 'session' ? 660 : 520,
          padding: kind === 'session' ? '1.2rem 1.4rem' : '1.5rem',
          margin: '0 auto',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h2 style={{ margin: '0 0 0.55rem 0', fontSize: '1.25rem' }}>{t(headings[kind])}</h2>

        {kind === 'session' ? (
          <SessionResourceFields
            name={name}
            setName={setName}
            setIsNameManuallyEdited={setIsNameManuallyEdited}
            date={date}
            setDate={setDate}
            courseId={courseId}
            setCourse={setCourse}
            periodId={periodId}
            setPeriod={setPeriod}
            groupId={groupId}
            setGroup={setGroup}
            courses={courses}
            periods={periods}
            groups={groups}
            filtered={filtered}
          />
        ) : (
          <>
            <label>
              {kind === 'course' ? t('courseName') : kind === 'period' ? t('periodName') : t('groupTitle')}
              <input value={name} onChange={e => setName(e.target.value)} maxLength={200} required autoFocus />
            </label>

            {kind === 'course' && (
              <label>
                {t('description')}
                <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={3000} />
              </label>
            )}

            {kind === 'group' && (
              <>
                <label>
                  {t('course')}
                  <select
                    value={courseId}
                    onChange={e => {
                      const newCid = e.target.value;
                      setCourse(newCid);
                      const c = courses.find(x => String(x.id) === newCid);
                      if (c && c.period_id) setPeriod(String(c.period_id));
                    }}
                    required
                  >
                    {courses.map(x => (
                      <option value={x.id} key={x.id}>{x.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('period')}
                  <select value={periodId} onChange={e => setPeriod(e.target.value)} required>
                    {periods.map(x => (
                      <option value={x.id} key={x.id}>{x.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('presentationDate')}
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </label>
              </>
            )}
          </>
        )}

        {kind === 'session' && (
          <ResourceFormCriteria sessionCriteria={sessionCriteria} setSessionCriteria={setSessionCriteria} />
        )}
        <div className="actions" style={{ marginTop: '0.5rem' }}>
          <button disabled={busy}>{t('create')}</button>
          <button type="button" className="secondary" onClick={close}>{t('cancel')}</button>
        </div>
      </form>
    </div>
  );
}
