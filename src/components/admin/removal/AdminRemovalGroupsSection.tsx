import React from 'react';
import { useT } from '../../../context/LocaleContext';

interface AdminRemovalGroupsSectionProps {
  groups: any[];
  courses: any[];
  editingGroupId: number | null;
  editGroupTitle: string;
  editGroupDate: string;
  editGroupCourseId: string;
  busySaving: boolean;
  setEditingGroupId: (id: number | null) => void;
  setEditGroupTitle: (val: string) => void;
  setEditGroupDate: (val: string) => void;
  setEditGroupCourseId: (val: string) => void;
  onSaveGroup: (id: number) => void;
  onSetConfirmModal: (modal: any) => void;
  renderLecturerBadge: (item: any) => React.ReactNode;
}

export function AdminRemovalGroupsSection({
  groups,
  courses,
  editingGroupId,
  editGroupTitle,
  editGroupDate,
  editGroupCourseId,
  busySaving,
  setEditingGroupId,
  setEditGroupTitle,
  setEditGroupDate,
  setEditGroupCourseId,
  onSaveGroup,
  onSetConfirmModal,
  renderLecturerBadge
}: AdminRemovalGroupsSectionProps) {
  const { t } = useT();

  return (
    <section style={{ margin: '1.5rem 0' }}>
      <h3>{t('groups')} ({groups.length})</h3>
      <div className="list">
        {groups.length ? (
          groups.map(g => {
            const isEditing = editingGroupId === g.id;
            if (isEditing) {
              return (
                <div className="card" key={g.id} style={{ background: '#f0fdfa', borderColor: '#99f6e4' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto auto', gap: '0.6rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="inline-edit-input"
                      value={editGroupTitle}
                      onChange={e => setEditGroupTitle(e.target.value)}
                      placeholder={t('groupTitle')}
                      disabled={busySaving}
                      autoFocus
                    />
                    <select
                      className="inline-edit-input"
                      value={editGroupCourseId}
                      onChange={e => setEditGroupCourseId(e.target.value)}
                      disabled={busySaving}
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="inline-edit-input"
                      value={editGroupDate}
                      onChange={e => setEditGroupDate(e.target.value)}
                      disabled={busySaving}
                    />
                    <button
                      type="button"
                      className="btn-inline-save"
                      onClick={() => onSaveGroup(g.id)}
                      disabled={busySaving}
                      title={t('save')}
                    >
                      💾 {busySaving ? '…' : t('save')}
                    </button>
                    <button
                      type="button"
                      className="secondary btn-inline-cancel"
                      onClick={() => setEditingGroupId(null)}
                      disabled={busySaving}
                      title={t('cancel')}
                    >
                      ✕ {t('cancel')}
                    </button>
                  </div>
                </div>
              );
            }

            const crs = courses.find(c => c.id === g.course_id);
            return (
              <div className="card row" key={g.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: '1rem', color: '#0f172a' }}>{g.title}</b>
                  {crs && <span style={{ color: '#475569', fontSize: '.88rem' }}>[{crs.name}]</span>}
                  {g.presentation_date && <span style={{ color: '#64748b', fontSize: '.85rem' }}>· {g.presentation_date}</span>}
                  {renderLecturerBadge(g)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <button
                    type="button"
                    className="btn-inline-edit"
                    onClick={() => {
                      setEditingGroupId(g.id);
                      setEditGroupTitle(g.title || '');
                      setEditGroupDate(g.presentation_date || '');
                      setEditGroupCourseId(g.course_id ? String(g.course_id) : (courses[0]?.id ? String(courses[0].id) : ''));
                    }}
                    title={t('edit')}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onSetConfirmModal({ path: `/groups/${g.id}`, label: g.title, verb: 'delete', isGroup: true })}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p>{t('noItems')}</p>
        )}
      </div>
    </section>
  );
}
