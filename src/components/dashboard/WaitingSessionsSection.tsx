import React from 'react';
import { useT } from '../../context/LocaleContext';
import { toGreekUppercase } from '../../utils/greek';
import { translateStatus } from '../../i18n';
import { SessionItem } from '../../types';

interface Props {
  sessions: SessionItem[];
  onAddSession: () => void;
  onActivate: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (s: SessionItem) => void;
}

export function WaitingSessionsSection({ sessions, onAddSession, onActivate, onEdit, onDelete }: Props) {
  const { t, language } = useT();

  return (
    <section style={{ margin: '2rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.6rem' }}>
        <h2>⏳ {t('waitingSessions')} ({sessions.length})</h2>
        <button type="button" className="secondary" onClick={onAddSession}>
          + {t('addSession')}
        </button>
      </div>
      <p style={{ color: '#64748b', fontSize: '.9rem', margin: '0 0 1rem 0' }}>
        {language === 'el'
          ? 'Συνεδρίες που έχουν προετοιμαστεί για διαφορετικές ομάδες. Μπορείτε να ενεργοποιήσετε μία κάθε φορά.'
          : 'Prepared sessions for different student groups. You can activate one session at a time.'}
      </p>

      <div className="grid">
        {sessions.length ? (
          sessions.map(s => (
            <div className="card session" key={s.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                  <span className="pill draft" lang="el">{toGreekUppercase(translateStatus(s.status, t))}</span>
                  <span style={{ fontSize: '.82rem', color: '#64748b' }}>{s.session_date}</span>
                </div>
                <h3 style={{ margin: '.3rem 0' }}>{s.title || `${t('session')} ${s.session_date}`}</h3>
                <p style={{ fontSize: '.88rem', color: '#475569' }}>
                  {s.course_name ? `${s.course_name}` : ''}
                  {s.group_title ? ` · ${s.group_title}` : ''}
                </p>
              </div>

              <div className="actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="primary"
                  style={{ fontSize: '.88rem', padding: '.45rem .85rem' }}
                  onClick={() => onActivate(s.id)}
                >
                  ▶️ {t('activateSession')}
                </button>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button
                    type="button"
                    className="secondary outline"
                    style={{ fontSize: '.82rem', padding: '.35rem .6rem' }}
                    onClick={() => onEdit(s.id)}
                    title={t('editSessionModalTitle')}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    type="button"
                    className="danger outline"
                    style={{ fontSize: '.82rem', padding: '.35rem .6rem' }}
                    onClick={() => onDelete(s)}
                  >
                    🗑️
                  </button>
                </div>
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
