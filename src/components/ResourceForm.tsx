import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { FormKind } from '../types';
import { ResourceFormCriteria } from './ResourceFormCriteria';

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourse] = useState(String(courses[0]?.id || ''));
  const [periodId, setPeriod] = useState(String(periods[0]?.id || ''));
  const [groupId, setGroup] = useState(String(groups[0]?.id || ''));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [sessionCriteria, setSessionCriteria] = useState<{ name: string; weight: number }[]>([
    { name: t('criterionScience'), weight: 40 },
    { name: t('criterionClarity'), weight: 30 },
    { name: t('criterionThinking'), weight: 30 }
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
      setGroup(String(filtered[0].id));
    }
  }, [courseId, periodId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (kind === 'course') {
        await api('/courses', json('POST', { name, description: description || null, period_id: Number(periodId) }));
      }
      if (kind === 'period') {
        await api('/periods', json('POST', { name }));
      }
      if (kind === 'group') {
        await api('/groups', json('POST', { title: name, course_id: Number(courseId), period_id: Number(periodId), presentation_date: date }));
      }
      if (kind === 'session') {
        const selected = groups.find(x => String(x.id) === groupId);
        const r = await api('/sessions', json('POST', {
          course_id: Number(courseId),
          period_id: Number(periodId),
          group_id: Number(groupId),
          session_date: selected?.presentation_date || date,
          title: name || null,
          criteria: sessionCriteria
        }));
        location.href = `/session/${r.id}`;
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
      <form className="card" onSubmit={submit}>
        <h2>{t(headings[kind])}</h2>
        {kind !== 'session' && (
          <label>
            {kind === 'course' ? t('courseName') : kind === 'period' ? t('periodName') : t('groupTitle')}
            <input value={name} onChange={e => setName(e.target.value)} maxLength={200} required autoFocus />
          </label>
        )}
        {kind === 'session' && (
          <label>
            {t('sessionTitle')}
            <input value={name} onChange={e => setName(e.target.value)} maxLength={200} autoFocus />
          </label>
        )}
        {kind === 'course' && (
          <label>
            {t('description')}
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={3000} />
          </label>
        )}
        {(kind === 'course' || kind === 'group' || kind === 'session') && (
          <label>
            {t('period')}
            <select value={periodId} onChange={e => setPeriod(e.target.value)} required>
              {periods.map(x => (
                <option value={x.id} key={x.id}>{x.name}</option>
              ))}
            </select>
          </label>
        )}
        {(kind === 'group' || kind === 'session') && (
          <label>
            {t('course')}
            <select value={courseId} onChange={e => setCourse(e.target.value)} required>
              {courses.filter(x => String(x.period_id) === periodId).map(x => (
                <option value={x.id} key={x.id}>{x.name}</option>
              ))}
            </select>
          </label>
        )}
        {kind === 'group' && (
          <label>
            {t('presentationDate')}
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </label>
        )}
        {kind === 'session' && (
          <label>
            {t('group')}
            <select value={groupId} onChange={e => setGroup(e.target.value)} required>
              {filtered.map(x => (
                <option value={x.id} key={x.id}>{x.title} · {x.presentation_date}</option>
              ))}
            </select>
          </label>
        )}
        {kind === 'session' && (
          <ResourceFormCriteria sessionCriteria={sessionCriteria} setSessionCriteria={setSessionCriteria} />
        )}
        <div className="actions">
          <button disabled={busy}>{t('create')}</button>
          <button type="button" className="secondary" onClick={close}>{t('cancel')}</button>
        </div>
      </form>
    </div>
  );
}
