import React from 'react';
import { useT } from '../../context/LocaleContext';
import { toGreekUppercase } from '../../utils/greek';
import { translateStatus } from '../../i18n';

interface Props {
  item: any;
  index: number;
  sessionStatus: string;
  isArchived: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (item: any, dir: 'UP' | 'DOWN') => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onAct: (path: string, body?: any) => void;
}

export function PresentationCard({
  item: p,
  index: idx,
  sessionStatus,
  isArchived,
  canMoveUp,
  canMoveDown,
  onMove,
  onEdit,
  onDelete,
  onAct
}: Props) {
  const { t } = useT();
  const isVotingOpen = p.status === 'VOTING_OPEN';

  return (
    <div className="card row" style={isVotingOpen ? { borderLeft: '4px solid #b52c35' } : {}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
        {p.status === 'PENDING' && !isArchived && sessionStatus !== 'COMPLETED' && (
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
            <button
              type="button"
              className="secondary outline"
              disabled={!canMoveUp}
              onClick={() => onMove(p, 'UP')}
              title={t('moveUp')}
              style={{ padding: '2px 7px', fontSize: '.75rem', lineHeight: 1, minWidth: '28px', opacity: canMoveUp ? 1 : 0.35 }}
            >
              ▲
            </button>
            <button
              type="button"
              className="secondary outline"
              disabled={!canMoveDown}
              onClick={() => onMove(p, 'DOWN')}
              title={t('moveDown')}
              style={{ padding: '2px 7px', fontSize: '.75rem', lineHeight: 1, minWidth: '28px', opacity: canMoveDown ? 1 : 0.35 }}
            >
              ▼
            </button>
          </div>
        )}
        <div>
          <span className={`pill ${p.status.toLowerCase()}`} lang="el">
            {toGreekUppercase(translateStatus(p.status, t))}
          </span>
          <span style={{ fontSize: '.85rem', color: '#687e95', marginLeft: '.5rem' }}>#{idx + 1}</span>
          <h3>{p.presenter_name}</h3>
          <p>{p.title || t('withoutTitle')} · <b>{p.vote_count}</b> {t('votes')}</p>
        </div>
      </div>

      {!isArchived && (
        <div className="actions">
          {sessionStatus !== 'COMPLETED' && (
            <button className="secondary" onClick={() => onEdit(p)} title={t('edit')}>
              ✏️ {t('edit')}
            </button>
          )}
          {sessionStatus === 'ACTIVE' && p.status === 'PENDING' && (
            <>
              <button onClick={() => onAct(`presentations/${p.id}/open`)}>▶️ {t('open')}</button>
              <button className="secondary" onClick={() => onAct(`presentations/${p.id}/skip`)}>{t('skip')}</button>
            </>
          )}
          {p.status === 'PENDING' && sessionStatus !== 'COMPLETED' && (
            <button
              type="button"
              className="danger outline"
              onClick={() => onDelete(p)}
              title={t('removePresenter')}
              style={{ padding: '.35rem .65rem' }}
            >
              🗑️
            </button>
          )}
          {p.status === 'VOTING_OPEN' && (
            <>
              <button className="secondary" onClick={() => onAct(`presentations/${p.id}/extend`, { seconds: 30 })}>
                {t('extendVoting')}
              </button>
              <button className="danger" onClick={() => onAct(`presentations/${p.id}/close`)}>
                {t('close')}
              </button>
            </>
          )}
          {sessionStatus === 'ACTIVE' && ['EVALUATED', 'NO_VOTES', 'CLOSED'].includes(p.status) && (
            <button
              type="button"
              className="secondary reopen-btn"
              onClick={() => onAct(`presentations/${p.id}/reopen`, { duration: 60 })}
              title={t('reopenVotingHint')}
            >
              🔄 {t('reopenVoting')}
            </button>
          )}
          {p.status === 'SKIPPED' && sessionStatus === 'ACTIVE' && (
            <button onClick={() => onAct(`presentations/${p.id}/skip`)}>{t('restore')}</button>
          )}
        </div>
      )}
    </div>
  );
}
