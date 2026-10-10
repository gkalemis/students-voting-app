import React from 'react';
import { Brand } from '../types';
import { useT } from '../context/LocaleContext';
import { AcademicLogo } from './AcademicLogo';

export function BrandHeader({ brand }: { brand?: Brand }) {
  const { t } = useT();
  const university = brand?.university_name || t('app');
  const school = brand?.school_name;
  const department = brand?.department_name;

  return (
    <header className="brand brand-header-enhanced" role="banner">
      <AcademicLogo logoUrl={brand?.logo_url} size={52} title={university} />
      <div className="brand-text-block">
        <strong className="brand-univ-name">{university}</strong>
        {(school || department) && (
          <div className="brand-sub-details">
            {school && <span className="brand-school-txt">{school}</span>}
            {school && department && <span className="brand-sep" aria-hidden="true"> · </span>}
            {department && <span className="brand-dept-txt">{department}</span>}
          </div>
        )}
      </div>
    </header>
  );
}
