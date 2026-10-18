import React from 'react';
import { useT } from '../../context/LocaleContext';

interface SessionResourceFieldsProps {
  name: string;
  setName: (v: string) => void;
  setIsNameManuallyEdited: (v: boolean) => void;
  date: string;
  setDate: (v: string) => void;
  courseId: string;
  setCourse: (v: string) => void;
  periodId: string;
  setPeriod: (v: string) => void;
  groupId: string;
  setGroup: (v: string) => void;
  courses: any[];
  periods: any[];
  groups: any[];
  filtered: any[];
}

export function SessionResourceFields({
  name,
  setName,
  setIsNameManuallyEdited,
  date,
  setDate,
  courseId,
  setCourse,
  periodId,
  setPeriod,
  groupId,
  setGroup,
  courses,
  periods,
  groups,
  filtered
}: SessionResourceFieldsProps) {
  const { t } = useT();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '0.45rem 0.75rem' }}>
      <label style={{ margin: 0 }}>
        {t('sessionTitle')}
        <input
          value={name}
          onChange={e => {
            setName(e.target.value);
            setIsNameManuallyEdited(true);
          }}
          placeholder={groups.find(x => String(x.id) === groupId)?.title || t('sessionTitle')}
          maxLength={200}
          style={{ padding: '0.45rem 0.65rem' }}
          autoFocus
        />
      </label>

      <label style={{ margin: 0 }}>
        {t('presentationDate')}
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: '0.45rem 0.65rem' }}
          required
        />
      </label>

      <label style={{ margin: 0 }}>
        {t('course')}
        <select
          value={courseId}
          onChange={e => {
            const newCid = e.target.value;
            setCourse(newCid);
            const c = courses.find(x => String(x.id) === newCid);
            if (c && c.period_id) setPeriod(String(c.period_id));
          }}
          style={{ padding: '0.45rem 0.65rem' }}
          required
        >
          {courses.map(x => (
            <option value={x.id} key={x.id}>{x.name}</option>
          ))}
        </select>
      </label>

      <label style={{ margin: 0 }}>
        {t('period')}
        <select
          value={periodId}
          onChange={e => setPeriod(e.target.value)}
          style={{ padding: '0.45rem 0.65rem' }}
          required
        >
          {periods.map(x => (
            <option value={x.id} key={x.id}>{x.name}</option>
          ))}
        </select>
      </label>

      <label style={{ margin: 0, gridColumn: '1 / -1' }}>
        {t('group')}
        <select
          value={groupId}
          onChange={e => {
            const nextGid = e.target.value;
            setGroup(nextGid);
            const grp = groups.find(x => String(x.id) === nextGid);
            if (grp?.title) setName(grp.title);
            if (grp?.presentation_date) setDate(grp.presentation_date);
          }}
          style={{ padding: '0.45rem 0.65rem' }}
          required
        >
          {filtered.map(x => (
            <option value={x.id} key={x.id}>{x.title} · {x.presentation_date}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
