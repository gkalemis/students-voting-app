import React, { useState } from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  students: any[];
  searchQuery: string;
  onDelete: (s: any) => void;
  onUpdate?: (studentId: number, data: { full_name: string; presentation_title?: string | null }) => Promise<void>;
  showLecturerBadge?: boolean;
}

export function StudentRosterList({ students, searchQuery, onDelete, onUpdate, showLecturerBadge }: Props) {
  const { t, language } = useT();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState('');

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setEditName(s.full_name || '');
    setEditTitle(s.presentation_title || '');
    setRowError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTitle('');
    setRowError('');
  };

  const handleSave = async (studentId: number) => {
    if (!editName.trim()) {
      setRowError(`${t('fullName')}: ${t('required')}`);
      return;
    }
    if (!onUpdate) return;
    setSaving(true);
    setRowError('');
    try {
      await onUpdate(studentId, {
        full_name: editName.trim(),
        presentation_title: editTitle.trim() || null
      });
      setEditingId(null);
    } catch (e: any) {
      setRowError(e?.message || (language === 'el' ? 'Σφάλμα αποθήκευσης' : 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  if (students.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', background: '#f8fafc', borderRadius: 8 }}>
        {searchQuery
          ? (language === 'el' ? 'Δεν βρέθηκαν φοιτητές με αυτή την αναζήτηση.' : 'No students found matching search.')
          : (language === 'el' ? 'Δεν υπάρχουν ακόμη φοιτητές σε αυτή την ομάδα.' : 'No students in this group yet.')}
      </div>
    );
  }

  return (
    <div className="student-roster-scroll">
      {students.map(x => {
        const isEditing = editingId === x.id;

        if (isEditing) {
          return (
            <div className="student-row-compact" key={x.id} style={{ background: '#f0fdfa', borderColor: '#99f6e4', flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="inline-edit-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="inline-edit-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder={t('fullName')}
                  disabled={saving}
                  autoFocus
                />
                <input
                  type="text"
                  className="inline-edit-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder={t('presentationSubject')}
                  disabled={saving}
                />
                <button
                  type="button"
                  className="btn-inline-save"
                  onClick={() => handleSave(x.id)}
                  disabled={saving}
                  title={t('save')}
                >
                  💾 {saving ? '…' : t('save')}
                </button>
                <button
                  type="button"
                  className="secondary btn-inline-cancel"
                  onClick={cancelEdit}
                  disabled={saving}
                  title={t('cancel')}
                >
                  ✕ {t('cancel')}
                </button>
              </div>
              {rowError && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.2rem' }}>{rowError}</span>}
            </div>
          );
        }

        return (
          <div className="student-row-compact" key={x.id}>
            <div className="student-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="student-name">{x.full_name}</span>
                {showLecturerBadge && x.owner_name && (
                  <span className="badge-lecturer" title={`${t('lecturer')}: ${x.owner_name}`}>
                    👤 {x.owner_name}
                  </span>
                )}
              </div>
              {x.presentation_title && (
                <span className="student-topic" title={x.presentation_title}>
                  «{x.presentation_title}»
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              {onUpdate && (
                <button
                  type="button"
                  className="btn-inline-edit"
                  onClick={() => startEdit(x)}
                  title={t('edit')}
                >
                  ✏️ {t('edit')}
                </button>
              )}
              <button
                type="button"
                className="danger btn-student-delete"
                onClick={() => onDelete(x)}
                title={t('delete')}
              >
                🗑️ {t('delete')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
