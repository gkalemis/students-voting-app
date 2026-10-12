import React from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  students: any[];
  searchQuery: string;
  onDelete: (s: any) => void;
}

export function StudentRosterList({ students, searchQuery, onDelete }: Props) {
  const { t, language } = useT();

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
      {students.map(x => (
        <div className="student-row-compact" key={x.id}>
          <div className="student-info">
            <span className="student-name">{x.full_name}</span>
            {x.presentation_title && (
              <span className="student-topic" title={x.presentation_title}>
                «{x.presentation_title}»
              </span>
            )}
          </div>
          <button
            type="button"
            className="danger btn-student-delete"
            onClick={() => onDelete(x)}
            title={t('delete')}
          >
            🗑️ {t('delete')}
          </button>
        </div>
      ))}
    </div>
  );
}
