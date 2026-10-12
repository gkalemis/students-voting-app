import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../context/LocaleContext';
import { toGreekUppercase } from '../../utils/greek';
import { SessionItem } from '../../types';

interface Props {
  sessions: SessionItem[];
  onDelete: (s: SessionItem) => void;
}

export function ArchivedSessionsSection({ sessions, onDelete }: Props) {
  const { t, language } = useT();

  return (
    <section style={{ margin: '2rem 0' }}>
      <h2>🔒 {t('archivedSessions')} ({sessions.length})</h2>
      <p style={{ color: '#64748b', fontSize: '.9rem', margin: '0 0 1rem 0' }}>
        {language === 'el'
          ? 'Ολοκληρωμένες συνεδρίες με αποσυρμένες ομάδες. Διατηρούνται ως αναφορά βαθμολογιών για προβολή αποτελεσμάτων και εξαγωγή.'
          : 'Completed sessions with retired groups. Preserved as grading records for results viewing and export.'}
      </p>

      <div className="grid">
        {sessions.length ? (
          sessions.map(s => (
            <div
              className="card session"
              key={s.id}
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                  <span className="pill archived" lang="el">{toGreekUppercase(t('archived'))}</span>
                  <span style={{ fontSize: '.82rem', color: '#64748b' }}>{s.session_date}</span>
                </div>
                <h3 style={{ margin: '.3rem 0' }}>{s.title || `${t('session')} ${s.session_date}`}</h3>
                <p style={{ fontSize: '.88rem', color: '#475569' }}>
                  {s.course_name ? `${s.course_name}` : ''}
                  {s.group_title ? ` · [${s.group_title}]` : ''}
                </p>
              </div>

              <div className="actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to={`/session/${s.id}`} className="button secondary" style={{ fontSize: '.88rem', padding: '.45rem .85rem' }}>
                  👁️ {t('results')}
                </Link>
                <button
                  type="button"
                  className="danger outline"
                  style={{ fontSize: '.82rem', padding: '.35rem .6rem' }}
                  onClick={() => onDelete(s)}
                >
                  🗑️ {t('delete')}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#64748b' }}>{t('noItems')}</p>
        )}
      </div>
    </section>
  );
}
