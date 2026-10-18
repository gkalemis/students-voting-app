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
    <div style={{ marginTop: '0.45rem', marginBottom: '0.45rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
        <b style={{ fontSize: '0.88rem', color: '#1e293b' }}>
          🏷️ {t('gradeCategories')}
        </b>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              background: isValid ? '#ecfdf5' : '#fffbeb',
              color: isValid ? '#047857' : '#b45309',
              border: `1px solid ${isValid ? '#a7f3d0' : '#fde68a'}`
            }}
          >
            {t('totalWeight')}: {totalWeight}% {isValid ? '✓' : '(≠ 100%)'}
          </span>
          <button
            type="button"
            className="secondary"
            onClick={addCriterion}
            style={{ fontSize: '0.78rem', minHeight: '26px', height: '26px', padding: '0.15rem 0.5rem' }}
            title={t('addCategory')}
          >
            + {t('addCategory')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {sessionCriteria.map((c, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.4rem',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '0.25rem 0.45rem',
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
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.88rem' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '80px' }}>
              <input
                type="number"
                min="1"
                max="100"
                value={c.weight}
                onChange={e => updateCriterion(idx, 'weight', e.target.value)}
                required
                style={{ textAlign: 'center', padding: '0.35rem 0.25rem', fontSize: '0.88rem' }}
              />
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>%</span>
            </div>
            <button
              type="button"
              className="danger"
              style={{ minHeight: '28px', height: '28px', padding: '0.1rem 0.45rem', fontSize: '0.8rem' }}
              disabled={sessionCriteria.length <= 1}
              onClick={() => removeCriterion(idx)}
              title={t('removeCategory')}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
