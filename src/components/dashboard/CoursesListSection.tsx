import React from 'react';
import { useT } from '../../context/LocaleContext';

interface CoursesListSectionProps {
  courses: any[];
  periods: any[];
  editingCourseId: number | null;
  editCourseName: string;
  editCourseDesc: string;
  editCoursePeriodId: string;
  busySaving: boolean;
  setEditingCourseId: (id: number | null) => void;
  setEditCourseName: (val: string) => void;
  setEditCourseDesc: (val: string) => void;
  setEditCoursePeriodId: (val: string) => void;
  onSaveCourse: (id: number) => void;
  onDeleteTarget: (target: { path: string; label: string; type: string }) => void;
}

export function CoursesListSection({
  courses,
  periods,
  editingCourseId,
  editCourseName,
  editCourseDesc,
  editCoursePeriodId,
  busySaving,
  setEditingCourseId,
  setEditCourseName,
  setEditCourseDesc,
  setEditCoursePeriodId,
  onSaveCourse,
  onDeleteTarget
}: CoursesListSectionProps) {
  const { t } = useT();

  return (
    <section style={{ margin: '1.5rem 0' }}>
      <h2>{t('courses')}</h2>
      {courses.length ? (
        <div className="list">
          {courses.map(c => {
            const isEditing = editingCourseId === c.id;
            if (isEditing) {
              return (
                <div className="card" key={c.id} style={{ background: '#f0fdfa', borderColor: '#99f6e4' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto auto', gap: '0.6rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="inline-edit-input"
                      value={editCourseName}
                      onChange={e => setEditCourseName(e.target.value)}
                      placeholder={t('courseName')}
                      disabled={busySaving}
                      autoFocus
                    />
                    <input
                      type="text"
                      className="inline-edit-input"
                      value={editCourseDesc}
                      onChange={e => setEditCourseDesc(e.target.value)}
                      placeholder={t('description')}
                      disabled={busySaving}
                    />
                    <select
                      className="inline-edit-input"
                      value={editCoursePeriodId}
                      onChange={e => setEditCoursePeriodId(e.target.value)}
                      disabled={busySaving}
                    >
                      <option value="">{t('period')}: --</option>
                      {periods.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-inline-save"
                      onClick={() => onSaveCourse(c.id)}
                      disabled={busySaving}
                      title={t('save')}
                    >
                      💾 {busySaving ? '…' : t('save')}
                    </button>
                    <button
                      type="button"
                      className="secondary btn-inline-cancel"
                      onClick={() => setEditingCourseId(null)}
                      disabled={busySaving}
                      title={t('cancel')}
                    >
                      ✕ {t('cancel')}
                    </button>
                  </div>
                </div>
              );
            }

            const prd = periods.find(p => p.id === c.period_id);
            return (
              <div className="card row" key={c.id}>
                <div>
                  <b style={{ fontSize: '1rem', color: '#0f172a' }}>{c.name}</b>
                  {c.description && <span style={{ color: '#64748b', fontSize: '.88rem', marginLeft: '.6rem' }}>({c.description})</span>}
                  {prd && <span style={{ color: '#0d9488', fontSize: '.82rem', marginLeft: '.6rem', fontWeight: 600 }}>[{prd.name}]</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <button
                    type="button"
                    className="btn-inline-edit"
                    onClick={() => {
                      setEditingCourseId(c.id);
                      setEditCourseName(c.name || '');
                      setEditCourseDesc(c.description || '');
                      setEditCoursePeriodId(c.period_id ? String(c.period_id) : '');
                    }}
                    title={t('edit')}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    type="button"
                    className="danger outline"
                    style={{ fontSize: '.82rem', padding: '.25rem .55rem' }}
                    onClick={() => onDeleteTarget({ path: `/courses/${c.id}`, label: c.name, type: t('course') })}
                  >
                    🗑️ {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>{t('noItems')}</p>
      )}
    </section>
  );
}
