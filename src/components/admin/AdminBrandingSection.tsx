import React from 'react';
import { useT } from '../../context/LocaleContext';
import { api, json } from '../../api';
import { translateError } from '../../i18n';
import { LogoUpload } from '../AdminForms';
import { getBrandingText } from '../../utils/branding';

interface AdminBrandingSectionProps {
  brand: any;
  setBrand: React.Dispatch<React.SetStateAction<any>>;
  onSuccess: (msg: string) => void;
  onError: (err: string) => void;
  onReload: () => void;
}

export function AdminBrandingSection({
  brand,
  setBrand,
  onSuccess,
  onError,
  onReload
}: AdminBrandingSectionProps) {
  const { t, language } = useT();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    try {
      await api('/branding', json('PUT', brand));
      onSuccess(t('brandingUpdated'));
      onReload();
    } catch (err) {
      onError(translateError(err, language));
    }
  };

  return (
    <section style={{ margin: '2rem 0' }}>
      <h2>🏛️ {t('academicBranding')}</h2>
      <p style={{ color: '#555', fontSize: '.9rem', margin: '0 0 1rem 0' }}>
        {language === 'el'
          ? 'Ορίστε τα επίσημα στοιχεία του ιδρύματος και το λογότυπο που θα εμφανίζονται σε όλες τις προβολές.'
          : 'Set the official university branding and logo that appears across all views.'}
      </p>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSave}>
          <LogoUpload
            saved={b => {
              setBrand(b);
              onSuccess(t('brandingUpdated'));
            }}
            failed={e => onError(translateError(e, language))}
          />

          <label>
            {language === 'el' ? 'Όνομα Ιδρύματος (Ελληνικά)' : 'University Name (Greek)'}
            <input
              value={getBrandingText(brand.university_name, 'el')}
              onChange={e =>
                setBrand({
                  ...brand,
                  university_name: {
                    el: e.target.value,
                    en: getBrandingText(brand.university_name, 'en')
                  }
                })
              }
            />
          </label>

          <label>
            {language === 'el' ? 'Όνομα Ιδρύματος (English)' : 'University Name (English)'}
            <input
              value={getBrandingText(brand.university_name, 'en')}
              onChange={e =>
                setBrand({
                  ...brand,
                  university_name: {
                    el: getBrandingText(brand.university_name, 'el'),
                    en: e.target.value
                  }
                })
              }
            />
          </label>

          <label>
            {language === 'el' ? 'Όνομα Σχολής / Τμήματος (Ελληνικά)' : 'Faculty / School Name (Greek)'}
            <input
              value={getBrandingText(brand.school_name, 'el')}
              onChange={e =>
                setBrand({
                  ...brand,
                  school_name: {
                    el: e.target.value,
                    en: getBrandingText(brand.school_name, 'en')
                  }
                })
              }
            />
          </label>

          <label>
            {language === 'el' ? 'Όνομα Σχολής / Τμήματος (English)' : 'Faculty / School Name (English)'}
            <input
              value={getBrandingText(brand.school_name, 'en')}
              onChange={e =>
                setBrand({
                  ...brand,
                  school_name: {
                    el: getBrandingText(brand.school_name, 'el'),
                    en: e.target.value
                  }
                })
              }
            />
          </label>

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="enableSampleFixture"
              checked={brand.enable_sample_fixture_button ?? true}
              onChange={e => setBrand({ ...brand, enable_sample_fixture_button: e.target.checked })}
              style={{ width: 'auto', margin: 0 }}
            />
            <label htmlFor="enableSampleFixture" style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
              {t('enableSampleFixtureButton')}
            </label>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button type="submit">{t('saveBranding')}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
