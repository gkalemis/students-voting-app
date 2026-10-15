import React from 'react';
import { useT } from '../../context/LocaleContext';

interface PeriodsListSectionProps {
  periods: any[];
  editingPeriodId: number | null;
  editPeriodName: string;
  busySaving: boolean;
  setEditingPeriodId: (id: number | null) => void;
  setEditPeriodName: (val: string) => void;
  onSavePeriod: (id: number) => void;
  onDeleteTarget: (target: { path: string; label: string; type: string }) => void;
}

export function PeriodsListSection({
  periods,
  editingPeriodId,
  editPeriodName,
  busySaving,
  setEditingPeriodId,
  setEditPeriodName,
  onSavePeriod,
  onDeleteTarget
}: PeriodsListSectionProps) {
  const { t } = useT();

  return (
    <section style={{ margin: '1.5rem 0' }}>
      <h2>{t('periods')}</h2>
      {periods.length ? (
        <div className="list">
          {periods.map(p => {
            const isEditing = editingPeriodId === p.id;
            if (isEditing) {
              return (
                <div className="card" key={p.id} style={{ background: '#f0fdfa', borderColor: '#99f6e4' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="inline-edit-input"
                      value={editPeriodName}
                      onChange={e => setEditPeriodName(e.target.value)}
                      placeholder={t('periodName')}
                      disabled={busySaving}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-inline-save"
                      onClick={() => onSavePeriod(p.id)}
                      disabled={busySaving}
                      title={t('save')}
                    >
                      💾 {busySaving ? '…' : t('save')}
                    </button>
                    <button
                      type="button"
                      className="secondary btn-inline-cancel"
                      onClick={() => setEditingPeriodId(null)}
                      disabled={busySaving}
                      title={t('cancel')}
                    >
                      ✕ {t('cancel')}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="card row" key={p.id}>
                <div>
                  <b style={{ fontSize: '1rem', color: '#0f172a' }}>{p.name}</b>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <button
                    type="button"
                    className="btn-inline-edit"
                    onClick={() => {
                      setEditingPeriodId(p.id);
                      setEditPeriodName(p.name || '');
                    }}
                    title={t('edit')}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    type="button"
                    className="danger outline"
                    style={{ fontSize: '.82rem', padding: '.25rem .55rem' }}
                    onClick={() => onDeleteTarget({ path: `/periods/${p.id}`, label: p.name, type: t('period') })}
                  >
                    🗑️ {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>{t('noItems')}</p>
      )}
    </section>
  );
}
