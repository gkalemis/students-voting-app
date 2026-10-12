import React from 'react';
import { useT } from '../../context/LocaleContext';

interface Props {
  name: string;
  topic: string;
  isAdding: boolean;
  onNameChange: (val: string) => void;
  onTopicChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function QuickAddPresenter({
  name,
  topic,
  isAdding,
  onNameChange,
  onTopicChange,
  onSubmit
}: Props) {
  const { t } = useT();

  return (
    <div className="card" style={{ padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, marginBottom: '1.25rem' }}>
      <div style={{ fontWeight: 650, fontSize: '.92rem', color: '#1e293b', marginBottom: '.6rem' }}>
        ➕ {t('quickAddPresenter')}
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={`${t('presenterFullName')} *`}
          value={name}
          onChange={e => onNameChange(e.target.value)}
          required
          disabled={isAdding}
          style={{ flex: '1 1 200px', minWidth: '180px', padding: '.45rem .75rem', fontSize: '.9rem' }}
        />
        <input
          type="text"
          placeholder={t('presentationTopic')}
          value={topic}
          onChange={e => onTopicChange(e.target.value)}
          disabled={isAdding}
          style={{ flex: '1 1 220px', minWidth: '180px', padding: '.45rem .75rem', fontSize: '.9rem' }}
        />
        <button
          type="submit"
          className="primary"
          disabled={isAdding || !name.trim()}
          style={{ padding: '.45rem 1.1rem', fontSize: '.9rem', whiteSpace: 'nowrap' }}
        >
          {isAdding ? '...' : `➕ ${t('quickAdd')}`}
        </button>
      </form>
    </div>
  );
}
