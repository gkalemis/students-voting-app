import React from 'react';
import { Result } from '../types';
import { useT } from '../context/LocaleContext';
import { toGreekUppercase } from '../utils/greek';

export function ResultsTable({ rows = [] }: { rows?: Result[] }) {
  const { t } = useT();

  return (
    <section>
      <h2>{t('results')}</h2>
      {!rows.some(x => x.rank) ? (
        <p>{t('noEvaluated')}</p>
      ) : (
        <table lang="el">
          <thead>
            <tr>
              <th lang="el">{toGreekUppercase(t('rank'))}</th>
              <th lang="el">{toGreekUppercase(t('presenter'))}</th>
              <th lang="el">{toGreekUppercase(t('votes'))}</th>
              <th lang="el">{toGreekUppercase(t('score'))}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x, i) => {
              const rankIcon = x.rank === 1 ? '🥇' : x.rank === 2 ? '🥈' : x.rank === 3 ? '🥉' : '';
              const rankClass = x.rank === 1 ? 'gold-rank' : x.rank === 2 ? 'silver-rank' : x.rank === 3 ? 'bronze-rank' : 'standard-rank';
              const score = x.weighted_score;

              return (
                <tr key={i}>
                  <td>
                    <span className={`rank-pill ${rankClass}`}>
                      {rankIcon} #{x.rank ?? '—'}
                    </span>
                  </td>
                  <td><b>{x.presenter_name}</b></td>
                  <td>👥 {x.vote_count}</td>
                  <td>
                    <span className="score-pill">
                      ⭐ {score !== undefined && score !== null ? score.toFixed(2) : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
