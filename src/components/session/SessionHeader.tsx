import React from 'react';
import { useT } from '../../context/LocaleContext';
import { toGreekUppercase } from '../../utils/greek';
import { translateStatus } from '../../i18n';

interface Props {
  session: any;
  onActivate: () => void;
  onOpenEditor: () => void;
  onShowComplete: () => void;
  onShowQr: () => void;
  onShowArchive: () => void;
  onShowDelete: () => void;
  archiving: boolean;
}

export function SessionHeader({
  session: s,
  onActivate,
  onOpenEditor,
  onShowComplete,
  onShowQr,
  onShowArchive,
  onShowDelete,
  archiving
}: Props) {
  const { t, language } = useT();
  const isArchived = s.status === 'ARCHIVED';

  return (
    <>
      <div className="title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>{s.title || t('session')}</h1>
            <span className={`pill ${s.status.toLowerCase()}`} lang="el">
              {toGreekUppercase(translateStatus(s.status, t))}
            </span>
          </div>
          <p style={{ margin: '.35rem 0 0 0', color: '#687e95' }}>
            {s.course_name ? `${s.course_name} · ` : ''}
            {s.period_name ? `${s.period_name} · ` : ''}
            {s.group_title ? `[${s.group_title}] · ` : ''}
            {s.session_date}
          </p>
        </div>

        <div className="actions">
          {(s.status === 'WAITING' || s.status === 'DRAFT') && (
            <button type="button" className="primary" onClick={onActivate}>
              ▶️ {t('activateSession')}
            </button>
          )}

          {(s.status === 'WAITING' || s.status === 'DRAFT' || s.status === 'ACTIVE') && (
            <button
              type="button"
              className="secondary outline"
              onClick={onOpenEditor}
              title={t('editSessionModalTitle')}
            >
              ✏️ {t('editSessionModalTitle')}
            </button>
          )}

          {s.status === 'ACTIVE' && (
            <button type="button" className="danger" onClick={onShowComplete}>
              ⏹️ {t('completeSession')}
            </button>
          )}

          <button type="button" className="secondary outline" onClick={onShowQr}>
            📱 {t('qrCode')}
          </button>

          <a href={`/projector/${s.public_id}`} target="_blank" rel="noreferrer" className="button secondary">
            📽️ {t('projector')}
          </a>

          {s.status === 'COMPLETED' && !isArchived && (
            <button
              type="button"
              className="primary"
              disabled={archiving}
              onClick={onShowArchive}
              title={t('archiveSessionHint')}
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
            >
              📦 {archiving ? '...' : t('archiveSession')}
            </button>
          )}

          {!isArchived && (
            <button
              type="button"
              className="danger outline"
              onClick={onShowDelete}
              title={t('delete')}
              style={{ padding: '.45rem .65rem' }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {isArchived && (
        <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid #64748b', padding: '1rem', margin: '1rem 0' }}>
          <b style={{ color: '#334155' }}>🔒 {t('archivedSessionNoticeTitle')}</b>
          <p style={{ margin: '.3rem 0 0 0', fontSize: '.9rem', color: '#64748b' }}>
            {t('archivedSessionNoticeDesc')}
          </p>
        </div>
      )}
    </>
  );
}
