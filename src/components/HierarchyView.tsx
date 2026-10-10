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
        {periods.map(period => (
          <div className="card" key={period.id}>
            <h3>{period.name}</h3>
            {courses.filter(course => course.period_id === period.id).map(course => (
              <div className="hierarchy-course" key={course.id}>
                <b>{course.name}</b>
                {groups.filter(group => group.course_id === course.id).map(group => (
                  <div className="hierarchy-group" key={group.id}>
                    <span>{group.title} · {group.presentation_date}</span>
                    <ul>
                      {(students[group.id] || []).map(student => (
                        <li key={student.id}>
                          {student.full_name}
                          {student.presentation_title && ` — ${student.presentation_title}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
