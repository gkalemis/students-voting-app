import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api } from '../api';

export function HierarchyView({
  periods, courses, groups, refreshKey = 0
}: {
  periods: any[];
  courses: any[];
  groups: any[];
  refreshKey?: number;
}) {
  const { t } = useT();
  const [students, setStudents] = useState<Record<number, any[]>>({});

  useEffect(() => {
    Promise.all(groups.map(async g => [g.id, await api(`/groups/${g.id}/students`)] as const))
      .then(rows => setStudents(Object.fromEntries(rows)))
      .catch(() => {});
  }, [groups.map(x => x.id).join(','), refreshKey]);

  return (
    <section>
      <h2>{t('hierarchy')}</h2>
      <div className="list">
        {courses.map(course => {
          const courseGroups = groups.filter(g => g.course_id === course.id);
          const distinctPeriodIds = [...new Set([
            ...(course.period_id ? [course.period_id] : []),
            ...courseGroups.map(g => g.period_id).filter(Boolean)
          ])];

          return (
            <div className="card" key={course.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📚</span>
                <h3 style={{ margin: 0 }}>{course.name}</h3>
              </div>
              {course.description && (
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0.35rem 0 0.5rem 0' }}>
                  {course.description}
                </p>
              )}

              {distinctPeriodIds.map(pid => {
                const periodObj = periods.find(p => p.id === pid);
                const periodGroups = courseGroups.filter(g => g.period_id === pid);

                return (
                  <div className="hierarchy-period" key={pid} style={{ paddingLeft: '1rem', borderLeft: '3px solid #cbd5e1', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e3a8a', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>🏛️</span>
                      <span>{periodObj ? periodObj.name : t('period')}</span>
                    </div>

                    {periodGroups.map(group => (
                      <div className="hierarchy-group" key={group.id} style={{ marginTop: '0.5rem', paddingLeft: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 650, color: '#334155' }}>
                          <span>👥</span>
                          <span>{group.title} {group.presentation_date ? `· ${group.presentation_date}` : ''}</span>
                        </div>
                        <ul style={{ marginTop: '0.25rem', paddingLeft: '1.4rem' }}>
                          {(students[group.id] || []).map(student => (
                            <li key={student.id} style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}>
                              <b>{student.full_name}</b>
                              {student.presentation_title && (
                                <span style={{ color: '#475569' }}> — «{student.presentation_title}»</span>
                              )}
                            </li>
                          ))}
                          {(!students[group.id] || students[group.id].length === 0) && (
                            <li style={{ color: '#94a3b8', fontStyle: 'italic', listStyle: 'none' }}>
                              {t('noItems')}
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}

                    {periodGroups.length === 0 && (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', margin: '0.4rem 0 0.2rem 0.75rem' }}>
                        {t('noItems')}
                      </p>
                    )}
                  </div>
                );
              })}

              {distinctPeriodIds.length === 0 && (
                <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #e2e8f0', marginTop: '0.75rem' }}>
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    {t('noItems')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="card" style={{ color: '#64748b' }}>
            {t('noItems')}
          </div>
        )}
      </div>
    </section>
  );
}
