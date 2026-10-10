import React from 'react';
import { useT } from '../context/LocaleContext';

interface Criterion {
  name: string;
  weight: number;
}

interface ResourceFormCriteriaProps {
  sessionCriteria: Criterion[];
  setSessionCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
}

export function ResourceFormCriteria({
  sessionCriteria,
  setSessionCriteria
}: ResourceFormCriteriaProps) {
  const { t } = useT();

  const totalWeight = sessionCriteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const isValid = totalWeight === 100;

  const updateCriterion = (index: number, field: 'name' | 'weight', value: any) => {
    const updated = [...sessionCriteria];
    updated[index] = {
      ...updated[index],
      [field]: field === 'weight' ? Number(value) : value
    };
    setSessionCriteria(updated);
  };

  const addCriterion = () => {
    setSessionCriteria([
      ...sessionCriteria,
      { name: `${t('category')} ${sessionCriteria.length + 1}`, weight: 10 }
    ]);
  };

  const removeCriterion = (index: number) => {
    if (sessionCriteria.length <= 1) return;
    setSessionCriteria(sessionCriteria.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <b style={{ fontSize: '0.92rem', color: '#1e293b' }}>
          🏷️ {t('gradeCategories')}
        </b>
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            background: isValid ? '#ecfdf5' : '#fffbeb',
            color: isValid ? '#047857' : '#b45309',
            border: `1px solid ${isValid ? '#a7f3d0' : '#fde68a'}`
          }}
        >
          {t('totalWeight')}: {totalWeight}% {isValid ? '✓' : '(≠ 100%)'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sessionCriteria.map((c, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '0.5rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <input
              type="text"
              placeholder={t('categoryName')}
              value={c.name}
              onChange={e => updateCriterion(idx, 'name', e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: '90px' }}>
              <input
                type="number"
                min="1"
                max="100"
                value={c.weight}
                onChange={e => updateCriterion(idx, 'weight', e.target.value)}
                required
                style={{ textAlign: 'center', padding: '0.6rem 0.3rem' }}
              />
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>%</span>
            </div>
            <button
              type="button"
              className="danger"
              style={{ minHeight: '34px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
              disabled={sessionCriteria.length <= 1}
              onClick={() => removeCriterion(idx)}
              title={t('removeCategory')}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '0.6rem' }}>
        <button
          type="button"
          className="secondary"
          onClick={addCriterion}
          style={{ width: '100%', fontSize: '0.85rem', minHeight: '34px' }}
        >
          + {t('addCategory')}
        </button>
      </div>
    </div>
  );
}
