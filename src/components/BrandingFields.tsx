import React from 'react';
import { useT } from '../context/LocaleContext';
import { Brand } from '../types';
import { getBrandingText } from '../utils/branding';

type BrandingName = 'university_name' | 'school_name' | 'department_name';

export function BrandingFields({ brand, setBrand }: {
  brand: Brand;
  setBrand: (brand: Brand) => void;
}) {
  const { t, language } = useT();

  function update(name: BrandingName, value: string) {
    const current = brand[name];
    const localized = typeof current === 'object' && current !== null
      ? { ...current, [language]: value }
      : { el: value, en: value };
    setBrand({ ...brand, [name]: localized });
  }

  return (
    <>
      <label>
        {t('universityName')}
        <input
          value={getBrandingText(brand.university_name, language)}
          onChange={event => update('university_name', event.target.value)}
        />
      </label>
      <label>
        {t('schoolName')}
        <input
          value={getBrandingText(brand.school_name, language)}
          onChange={event => update('school_name', event.target.value)}
        />
      </label>
      <label style={{ gridColumn: '1 / -1' }}>
        {t('departmentName')}
        <input
          value={getBrandingText(brand.department_name, language)}
          onChange={event => update('department_name', event.target.value)}
        />
      </label>
    </>
  );
}
