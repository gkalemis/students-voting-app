import React from 'react';
import { useT } from '../../context/LocaleContext';

export interface PresenterRow {
  id?: number;
  presenter_name: string;
  title: string;
  status?: string;
  vote_count?: number;
  position: number;
}

interface Props {
  row: PresenterRow;
  index: number;
  total: number;
  onUpdate: (idx: number, field: 'presenter_name' | 'title', value: string) => void;
  onMove: (idx: number, direction: 'up' | 'down') => void;
  onRemove: (idx: number) => void;
}

export function PresenterRowEditor({ row, index, total, onUpdate, onMove, onRemove }: Props) {
  const { t } = useT();
  const isEvaluated = row.status === 'EVALUATED' || (row.vote_count !== undefined && row.vote_count > 0);
  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr 1.2fr auto auto',
        gap: '.5rem',
        alignItems: 'center',
        background: '#f8fafc',
        padding: '.6rem .75rem',
        borderRadius: 8,
        border: '1px solid #e2e8f0'
      }}
    >
      <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#64748b', minWidth: '1.8rem', textAlign: 'center' }}>
        #{index + 1}
      </span>

      <input
        type="text"
        value={row.presenter_name}
        onChange={e => onUpdate(index, 'presenter_name', e.target.value)}
        placeholder={t('presenterFullName')}
        required
        style={{ padding: '.35rem .6rem', fontSize: '.88rem' }}
      />

      <input
        type="text"
        value={row.title}
        onChange={e => onUpdate(index, 'title', e.target.value)}
        placeholder={t('presentationTopic')}
        style={{ padding: '.35rem .6rem', fontSize: '.88rem' }}
      />

      <div style={{ display: 'inline-flex', gap: '2px' }}>
        <button
          type="button"
          className="secondary outline"
          disabled={!canMoveUp}
          onClick={() => onMove(index, 'up')}
          title={t('moveUp')}
          style={{ padding: '2px 6px', fontSize: '.75rem', minWidth: '24px', opacity: canMoveUp ? 1 : 0.3 }}
        >
          ▲
        </button>
        <button
          type="button"
          className="secondary outline"
          disabled={!canMoveDown}
          onClick={() => onMove(index, 'down')}
          title={t('moveDown')}
          style={{ padding: '2px 6px', fontSize: '.75rem', minWidth: '24px', opacity: canMoveDown ? 1 : 0.3 }}
        >
          ▼
        </button>
      </div>

      <button
        type="button"
        className="danger outline"
        disabled={isEvaluated}
        onClick={() => onRemove(index)}
        title={isEvaluated ? t('cannotRemovePresentedNotice') || 'Cannot remove completed presentation' : t('removePresenter')}
        style={{ padding: '3px 8px', fontSize: '.82rem', opacity: isEvaluated ? 0.3 : 1 }}
      >
        ✕
      </button>
    </div>
  );
}
