import React from 'react';
import { Result } from '../types';
import { useT } from '../context/LocaleContext';
import { toGreekUppercase } from '../utils/greek';

interface ResultsPodiumProps {
  rows?: Result[];
  isProjector?: boolean;
}

export function ResultsPodium({ rows = [], isProjector = false }: ResultsPodiumProps) {
  const { t, language } = useT();

  if (!rows || rows.length === 0 || !rows.some(r => r.rank !== undefined && r.rank !== null)) {
    return (
      <div className="card empty-results-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>{t('noEvaluated')}</p>
      </div>
    );
  }

  // Sort descending by rank (1, 2, 3...)
  const sorted = [...rows].sort((a, b) => {
    if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
    if (a.rank !== undefined) return -1;
    if (b.rank !== undefined) return 1;
    return (b.weighted_score || 0) - (a.weighted_score || 0);
  });

  const first = sorted.find(r => r.rank === 1);
  const second = sorted.find(r => r.rank === 2);
  const third = sorted.find(r => r.rank === 3);

  const topThree = [first, second, third].filter(Boolean) as Result[];
  const remaining = sorted.filter(r => !topThree.some(top => top.presentation_id === r.presentation_id || (top.presenter_name === r.presenter_name && top.rank === r.rank)));

  // Display order for podium pedestal: 2nd place (left), 1st place (center), 3rd place (right)
  const podiumOrder = isProjector
    ? [
        { item: second, rank: 2, key: 'silver' },
        { item: first, rank: 1, key: 'gold' },
        { item: third, rank: 3, key: 'bronze' }
      ]
    : [
        { item: first, rank: 1, key: 'gold' },
        { item: second, rank: 2, key: 'silver' },
        { item: third, rank: 3, key: 'bronze' }
      ];

  const getRankConfig = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: '🥇',
          label: language === 'el' ? '1η ΘΕΣΗ · ΧΡΥΣΟ' : '1st PLACE · GOLD',
          badgeClass: 'podium-badge-gold',
          cardClass: 'podium-card-gold',
          glowColor: 'rgba(245, 158, 11, 0.25)',
          borderColor: '#f59e0b',
          accentColor: '#b45309'
        };
      case 2:
        return {
          icon: '🥈',
          label: language === 'el' ? '2η ΘΕΣΗ · ΑΣΗΜΙ' : '2nd PLACE · SILVER',
          badgeClass: 'podium-badge-silver',
          cardClass: 'podium-card-silver',
          glowColor: 'rgba(148, 163, 184, 0.25)',
          borderColor: '#94a3b8',
          accentColor: '#475569'
        };
      case 3:
        return {
          icon: '🥉',
          label: language === 'el' ? '3η ΘΕΣΗ · ΧΑΛΚΙΝΟ' : '3rd PLACE · BRONZE',
          badgeClass: 'podium-badge-bronze',
          cardClass: 'podium-card-bronze',
          glowColor: 'rgba(217, 119, 6, 0.2)',
          borderColor: '#d97706',
          accentColor: '#92400e'
        };
      default:
        return {
          icon: '🎖️',
          label: `#${rank}`,
          badgeClass: 'podium-badge-standard',
          cardClass: 'podium-card-standard',
          glowColor: 'transparent',
          borderColor: '#cbd5e1',
          accentColor: '#334155'
        };
    }
  };

  return (
    <div className={`podium-container ${isProjector ? 'podium-projector' : 'podium-mobile'}`}>
      <div className="podium-header-banner">
        <div className="podium-trophy-icon">🏆</div>
        <div>
          <h2 className="podium-main-title">{t('finalResults')}</h2>
          <p className="podium-subtitle">
            {language === 'el' ? 'Κατάταξη σε φθίνουσα σειρά βαθμολογίας' : 'Rankings in descending order of score'}
          </p>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="podium-grid">
        {podiumOrder.map(({ item, rank, key }) => {
          if (!item) return null;
          const config = getRankConfig(rank);
          const score = item.weighted_score !== undefined && item.weighted_score !== null
            ? item.weighted_score.toFixed(2)
            : '—';

          return (
            <div
              key={key}
              className={`podium-card ${config.cardClass} rank-${rank}`}
            >
              <div className="podium-crown-header">
                <span className={`podium-badge ${config.badgeClass}`}>
                  <span className="podium-medal">{config.icon}</span>
                  <span className="podium-badge-text">{config.label}</span>
                </span>
                <span className="podium-rank-number">#{rank}</span>
              </div>

              <div className="podium-presenter-info">
                <h3 className="podium-presenter-name">{item.presenter_name}</h3>
                {item.title && (
                  <p className="podium-presentation-title" title={item.title}>
                    {item.title}
                  </p>
                )}
              </div>

              <div className="podium-score-box">
                <div className="podium-score-metric">
                  <span className="podium-score-star">⭐</span>
                  <span className="podium-score-value">{score}</span>
                  <span className="podium-score-scale">/ 5</span>
                </div>
                <div className="podium-vote-count">
                  👥 {item.vote_count} {language === 'el' ? (item.vote_count === 1 ? 'ψήφος' : 'ψήφοι') : (item.vote_count === 1 ? 'vote' : 'votes')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining Participants (Rank 4+) */}
      {remaining.length > 0 && (
        <div className="podium-remaining-section">
          <h3 className="podium-remaining-heading">
            📋 {t('otherRankings')} ({remaining.length})
          </h3>
          <div className="podium-table-wrapper">
            <table className="podium-table" lang="el">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>{toGreekUppercase(t('rank'))}</th>
                  <th>{toGreekUppercase(t('presenter'))}</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>{toGreekUppercase(t('votes'))}</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>{toGreekUppercase(t('score'))}</th>
                </tr>
              </thead>
              <tbody>
                {remaining.map((item, idx) => {
                  const itemRank = item.rank ?? (idx + 4);
                  const itemScore = item.weighted_score !== undefined && item.weighted_score !== null
                    ? item.weighted_score.toFixed(2)
                    : '—';

                  return (
                    <tr key={idx} className="podium-row-standard">
                      <td>
                        <span className="podium-row-rank">#{itemRank}</span>
                      </td>
                      <td>
                        <div className="podium-row-presenter">
                          <strong className="podium-row-name">{item.presenter_name}</strong>
                          {item.title && <span className="podium-row-title">{item.title}</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="podium-row-votes">👥 {item.vote_count}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="podium-row-score">⭐ {itemScore}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
