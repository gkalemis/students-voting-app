import React from 'react';
import { PollResultDistribution, PollQuestionType } from '../../pollTypes';
import { useT } from '../../context/LocaleContext';

interface Props {
  distribution: PollResultDistribution[];
  totalVotes: number;
  correctOptionIndex?: number | null;
  questionType?: PollQuestionType;
  isProjector?: boolean;
}

const BAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
];

const OPTION_LETTERS = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η'];

export function PollVerticalChart({
  distribution,
  totalVotes,
  correctOptionIndex,
  questionType,
  isProjector = false,
}: Props) {
  const { t } = useT();

  return (
    <div className="poll-vertical-chart" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: isProjector ? '1.15rem' : '0.9rem', fontWeight: 700, color: '#475569' }}>
          📊 {t('pollResults')} (Κάθετες Στήλες)
        </span>
        <span style={{ fontSize: isProjector ? '1.15rem' : '0.85rem', fontWeight: 800, color: '#1e293b', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: 9999 }}>
          {totalVotes} {t('votesCast')}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          height: isProjector ? '320px' : '220px',
          padding: '1rem 0.5rem 0.5rem 0.5rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '1rem',
          gap: '1rem'
        }}
      >
        {distribution.map((item, idx) => {
          const isCorrect = correctOptionIndex !== null && correctOptionIndex !== undefined && correctOptionIndex === item.option_index;
          const letter = questionType === 'TRUE_FALSE' ? (idx === 0 ? '✓' : '✗') : (OPTION_LETTERS[idx] || String(idx + 1));
          const color = isCorrect ? 'linear-gradient(135deg, #10b981, #059669)' : (BAR_COLORS[idx % BAR_COLORS.length]);
          const heightPct = Math.max(item.percentage, item.count > 0 ? 6 : 4);

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: isProjector ? '1.1rem' : '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                {item.percentage}%
              </div>
              <div style={{ fontSize: isProjector ? '0.85rem' : '0.7rem', color: '#64748b', marginBottom: '0.35rem' }}>
                {item.count} ψ.
              </div>

              {/* Vertical column */}
              <div style={{ width: '100%', maxWidth: '70px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    background: color,
                    borderRadius: '0.5rem 0.5rem 0 0',
                    transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: isCorrect ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                />
              </div>

              {/* Option letter & badge */}
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                <span
                  style={{
                    width: isProjector ? '32px' : '26px',
                    height: isProjector ? '32px' : '26px',
                    borderRadius: '50%',
                    background: isCorrect ? '#10b981' : '#334155',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: isProjector ? '0.95rem' : '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {letter}
                </span>
                <span
                  style={{
                    fontSize: isProjector ? '0.85rem' : '0.7rem',
                    color: '#334155',
                    fontWeight: 600,
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.option_text}
                >
                  {item.option_text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
