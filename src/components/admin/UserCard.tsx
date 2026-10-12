import React from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  user: any;
  currentUserId: number;
  onToggle: (u: any) => void;
  onReset: (u: any) => void;
  onDelete: (u: any) => void;
}

export function UserCard({ user, currentUserId, onToggle, onReset, onDelete }: Props) {
  const { t } = useT();

  return (
    <div className="user-card">
      <div className="user-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
          <b style={{ fontSize: '1.05rem', color: '#0f172a' }}>{user.full_name}</b>
          <span style={{ color: '#64748b', fontSize: '.88rem' }}>({user.username})</span>
        </div>
        <div className="user-badges">
          <span className={`badge-role ${user.role === 'ADMIN' ? 'admin' : ''}`}>
            {user.role === 'ADMIN' ? `🛡️ ${t('admin')}` : `🎓 ${t('lecturer')}`}
          </span>
          <span className={`badge-status ${user.active ? 'active' : 'inactive'}`}>
            {user.active ? `● ${t('active')}` : `○ ${t('inactive')}`}
          </span>
        </div>
      </div>

      <div className="user-actions">
        {user.id !== currentUserId && (
          <button
            className={`btn-action-sm ${user.active ? 'secondary' : 'primary'}`}
            onClick={() => onToggle(user)}
          >
            {user.active ? t('deactivate') : t('activate')}
          </button>
        )}
        <button
          className="btn-action-sm secondary outline"
          onClick={() => onReset(user)}
          title={t('resetPassword')}
        >
          🔑 {t('resetPassword')}
        </button>
        {user.id !== currentUserId && (
          <button
            className="btn-action-sm danger"
            onClick={() => onDelete(user)}
            title={t('delete')}
          >
            🗑️ {t('delete')}
          </button>
        )}
      </div>
    </div>
  );
}
