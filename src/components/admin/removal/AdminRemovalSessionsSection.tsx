import React from 'react';
import { useT } from '../../../context/LocaleContext';
import { translateStatus } from '../../../i18n';
import { toGreekUppercase } from '../../../utils/greek';

interface AdminRemovalSessionsSectionProps {
  sessions: any[];
  onSetConfirmModal: (modal: any) => void;
  renderLecturerBadge: (item: any) => React.ReactNode;
}

export function AdminRemovalSessionsSection({
  sessions,
  onSetConfirmModal,
  renderLecturerBadge
}: AdminRemovalSessionsSectionProps) {
  const { t } = useT();

  return (
    <section style={{ margin: '1.5rem 0' }}>
      <h3>{t('sessions')} ({sessions.length})</h3>
      <div className="list">
        {sessions.length ? (
          sessions.map(x => (
            <div className="card row" key={x.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span>
                  {x.title || `${t('session')} ${x.session_date}`} ·{' '}
                  <span className={`pill ${x.status.toLowerCase()}`} lang="el" style={{ marginLeft: '.5rem', fontSize: '.72rem' }}>
                    {toGreekUppercase(translateStatus(x.status, t))}
                  </span>
                </span>
                {renderLecturerBadge(x)}
              </div>
              <div className="actions">
                {x.status === 'COMPLETED' && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onSetConfirmModal({ path: `/sessions/${x.id}/archive`, label: x.title || x.session_date, verb: 'archive' })}
                  >
                    {t('archiveAction')}
                  </button>
                )}
                <button
                  type="button"
                  className="danger"
                  onClick={() => onSetConfirmModal({ path: `/sessions/${x.id}`, label: x.title || x.session_date, verb: 'delete' })}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>{t('noItems')}</p>
        )}
      </div>
    </section>
  );
}
