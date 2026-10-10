import React from 'react';
import { useT } from '../context/LocaleContext';
import { toGreekUppercase } from '../utils/greek';

export function ResourceSection({ title, items }: { title: string; items: string[] }) {
  const { t } = useT();
  return (
    <section>
      <h2>{title}</h2>
      {items.length ? (
        <div className="resource-list" lang="el">
          {items.map((x, i) => (
            <span className="pill resource" lang="el" key={`${x}-${i}`}>
              {toGreekUppercase(x)}
            </span>
          ))}
        </div>
      ) : (
        <p>{t('noItems')}</p>
      )}
    </section>
  );
}
