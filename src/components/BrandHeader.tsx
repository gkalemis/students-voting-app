import React from 'react';
import { Brand } from '../types';
import { useT } from '../context/LocaleContext';
import { AcademicLogo } from './AcademicLogo';
import { getBrandingText } from '../utils/branding';

export function BrandHeader({ brand, isProjector = false }: { brand?: Brand; isProjector?: boolean }) {
  const { t, language } = useT();
  const university = getBrandingText(brand?.university_name, language) || t('app');
  const school = getBrandingText(brand?.school_name, language);
  const department = getBrandingText(brand?.department_name, language);
  const logoSize = isProjector ? 110 : 52;

  return (
    <header className={`brand brand-header-enhanced ${isProjector ? 'projector-brand-header' : ''}`} role="banner">
      <AcademicLogo logoUrl={brand?.logo_url} size={logoSize} title={university} />
      <div className="brand-text-block">
        <strong className={`brand-univ-name ${isProjector ? 'projector-univ-title' : ''}`}>{university}</strong>
        {(school || department) && (
          <div className={`brand-sub-details ${isProjector ? 'projector-sub-details' : ''}`}>
            {school && <span className="brand-school-txt">{school}</span>}
            {school && department && <span className="brand-sep" aria-hidden="true"> · </span>}
            {department && <span className="brand-dept-txt">{department}</span>}
          </div>
        )}
      </div>
    </header>
  );
}
