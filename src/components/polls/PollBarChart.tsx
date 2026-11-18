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
  'linear-gradient(135deg, #3b82f6, #2563eb)', // Blue
  'linear-gradient(135deg, #10b981, #059669)', // Emerald
  'linear-gradient(135deg, #f59e0b, #d97706)', // Amber
  'linear-gradient(135deg, #8b5cf6, #7c3aed)', // Purple
  'linear-gradient(135deg, #ec4899, #db2777)', // Pink
  'linear-gradient(135deg, #06b6d4, #0891b2)', // Cyan
];

const OPTION_LETTERS = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η'];

export function PollBarChart({
  distribution,
  totalVotes,
  correctOptionIndex,
  questionType,
  isProjector = false,
}: Props) {
  const { t } = useT();

  return (
    <div className={`poll-bar-chart-container ${isProjector ? 'chart-projector' : 'chart-standard'}`} style={{ display: 'flex', flexDirection: 'column', gap: isProjector ? '1.25rem' : '0.85rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: isProjector ? '1.15rem' : '0.9rem', fontWeight: 700, color: '#475569' }}>
          📊 {t('pollResults')}
        </span>
        <span style={{ fontSize: isProjector ? '1.15rem' : '0.85rem', fontWeight: 800, color: '#1e293b', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: 9999 }}>
          {totalVotes} {t('votesCast')}
        </span>
      </div>

      {distribution.map((item, idx) => {
        const isCorrect = correctOptionIndex !== null && correctOptionIndex !== undefined && correctOptionIndex === item.option_index;
        const letter = questionType === 'TRUE_FALSE' ? (idx === 0 ? '✓' : '✗') : (OPTION_LETTERS[idx] || String(idx + 1));
        const color = isCorrect ? 'linear-gradient(135deg, #10b981, #059669)' : (BAR_COLORS[idx % BAR_COLORS.length]);

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: isProjector ? '0.75rem 1rem' : '0.5rem 0.65rem',
              borderRadius: '0.75rem',
              background: isCorrect ? '#ecfdf5' : '#f8fafc',
              border: isCorrect ? '2px solid #10b981' : '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isProjector ? '34px' : '26px',
                    height: isProjector ? '34px' : '26px',
                    borderRadius: '50%',
                    background: isCorrect ? '#10b981' : '#334155',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: isProjector ? '1rem' : '0.8rem'
                  }}
                >
                  {letter}
                </span>
                <span style={{ fontSize: isProjector ? '1.25rem' : '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                  {item.option_text}
                </span>
                {isCorrect && (
                  <span style={{ fontSize: isProjector ? '0.85rem' : '0.72rem', background: '#10b981', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                    ✓ {t('correctAnswer')}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: isProjector ? '1.2rem' : '0.88rem', color: '#64748b' }}>
                  {item.count} {t('votesCast')}
                </span>
                <span style={{ fontSize: isProjector ? '1.4rem' : '1.05rem', fontWeight: 800, color: '#0f172a', minWidth: '55px', textAlign: 'right' }}>
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Animated percentage bar */}
            <div style={{ width: '100%', height: isProjector ? '18px' : '12px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '9999px',
                  transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
