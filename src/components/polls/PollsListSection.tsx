import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../context/LocaleContext';
import { translateStatus } from '../../i18n';

interface Props {
  polls: any[];
  onOpenCreate: () => void;
  onEditPoll: (poll: any) => void;
  onDeletePoll: (poll: any) => void;
}

export function PollsListSection({ polls, onOpenCreate, onEditPoll, onDeletePoll }: Props) {
  const { t, language } = useT();
  const navigate = useNavigate();

  return (
    <div className="card" style={{ marginTop: '1.5rem', background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{t('quizPoll')}</h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {language === 'el' ? 'Αυτόνομες ερωτήσεις κλειστού τύπου με ζωντανή προβολή αποτελεσμάτων' : 'Closed-ended questions with live real-time bar chart results'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="btn-create-session"
          style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}
        >
          <span>🎯</span>
          <span>+ {t('quizPoll')}</span>
        </button>
      </div>

      {polls.length === 0 ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <p style={{ margin: '0 0 0.75rem 0', color: '#64748b', fontWeight: 600 }}>
            {language === 'el' ? 'Δεν υπάρχουν ακόμη ενεργές δημοσκοπήσεις ή quiz.' : 'No active polls or quizzes created yet.'}
          </p>
          <button type="button" onClick={onOpenCreate} className="outline" style={{ fontSize: '0.85rem' }}>
            + {t('quizPoll')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {polls.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '0.9rem 1.1rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{p.title}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 9999, background: p.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: p.status === 'ACTIVE' ? '#166534' : '#475569' }}>
                    {translateStatus(p.status, t)}
                  </span>
                </div>
                <div style={{ fontSize: '0.83rem', color: '#64748b', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span>🎓 {p.course_name}</span>
                  {p.period_name && <span>🏛️ {p.period_name}</span>}
                  <span>📝 {p.questions_count} {t('questions')}</span>
                  <span>📅 {p.session_date}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary"
                  onClick={() => navigate(`/poll/${p.id}`)}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  🚀 {language === 'el' ? 'Κονσόλα' : 'Host Console'}
                </button>
                <button
                  type="button"
                  className="outline"
                  onClick={() => onEditPoll(p)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', borderColor: '#6366f1', color: '#6366f1' }}
                >
                  ✏️ {language === 'el' ? 'Διαμόρφωση' : 'Edit'}
                </button>
                <a
                  href={`/projector/${p.public_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                >
                  🖥️ {t('projector')}
                </a>
                <a
                  href={`/join/${p.public_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                >
                  📱 {language === 'el' ? 'Κινητό' : 'Phone'}
                </a>
                <button
                  type="button"
                  className="outline danger"
                  onClick={() => onDeletePoll(p)}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  aria-label={`${t('delete')}: ${p.title}`}
                  title={t('delete')}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
