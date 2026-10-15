import React from 'react';
import { useT } from '../../../context/LocaleContext';

interface AdminRemovalStudentRowProps {
  std: any;
  isEditing: boolean;
  editStudentName: string;
  setEditStudentName: (val: string) => void;
  editStudentTitle: string;
  setEditStudentTitle: (val: string) => void;
  onSaveStudent: (id: number) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  busySaving: boolean;
  renderLecturerBadge: (item: any) => React.ReactNode;
}

export function AdminRemovalStudentRow({
  std,
  isEditing,
  editStudentName,
  setEditStudentName,
  editStudentTitle,
  setEditStudentTitle,
  onSaveStudent,
  onCancelEdit,
  onStartEdit,
  onDelete,
  busySaving,
  renderLecturerBadge
}: AdminRemovalStudentRowProps) {
  const { t } = useT();

  if (isEditing) {
    return (
      <div
        style={{
          padding: '0.5rem 0.65rem',
          background: '#f0fdfa',
          border: '1px solid #99f6e4',
          borderRadius: 6,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto auto',
          gap: '0.5rem',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          className="inline-edit-input"
          value={editStudentName}
          onChange={e => setEditStudentName(e.target.value)}
          placeholder={t('fullName')}
          disabled={busySaving}
          autoFocus
        />
        <input
          type="text"
          className="inline-edit-input"
          value={editStudentTitle}
          onChange={e => setEditStudentTitle(e.target.value)}
          placeholder={t('presentationSubject')}
          disabled={busySaving}
        />
        <button
          type="button"
          className="btn-inline-save"
          onClick={() => onSaveStudent(std.id)}
          disabled={busySaving}
          title={t('save')}
        >
          💾 {busySaving ? '…' : t('save')}
        </button>
        <button
          type="button"
          className="secondary btn-inline-cancel"
          onClick={onCancelEdit}
          disabled={busySaving}
          title={t('cancel')}
        >
          ✕ {t('cancel')}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.45rem 0.65rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
        <b style={{ fontSize: '0.9rem', color: '#0f172a' }}>{std.full_name}</b>
        {std.presentation_title && (
          <span style={{ fontSize: '0.82rem', color: '#475569' }}>
            «{std.presentation_title}»
          </span>
        )}
        {renderLecturerBadge(std)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          type="button"
          className="btn-inline-edit"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', minHeight: 26 }}
          onClick={onStartEdit}
          title={t('edit')}
        >
          ✏️ {t('edit')}
        </button>
        <button
          type="button"
          className="danger"
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', minHeight: 26 }}
          onClick={onDelete}
          title={t('delete')}
        >
          🗑️ {t('delete')}
        </button>
      </div>
    </div>
  );
}
