import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';
import { UserForm, LogoUpload } from '../components/AdminForms';
import { ResetPasswordModal, DeleteUserModal } from '../components/AdminModals';
import { AdminRemovalPanel } from '../components/AdminRemovalPanel';
import { UserCard } from '../components/admin/UserCard';
import { ResetDbModal } from '../components/admin/ResetDbModal';
import { getBrandingText } from '../utils/branding';

export function Admin() {
  const { user: currentUser } = useAuth();
  const { t, language } = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [brand, setBrand] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showResetDbModal, setShowResetDbModal] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleResetDb() {
    setError('');
    try {
      await api('/admin/reset-db', json('POST', {}));
      setMessage(t('resetDatabaseSuccess'));
      setShowResetDbModal(false);
      load();
    } catch (e) {
      setError(translateError(e, language));
    }
  }

  const load = () => {
    api('/users').then(setUsers).catch(e => setError(translateError(e, language)));
    api('/branding').then(setBrand).catch(e => setError(translateError(e, language)));
  };

  useEffect(load, [language]);

  async function toggleUser(target: any) {
    setError('');
    try {
      const updated = await api(`/users/${target.id}`, json('PATCH', { active: !target.active }));
      setMessage(updated.active ? t('userReactivated') : t('userDeactivated'));
      load();
    } catch (e) {
      setError(translateError(e, language));
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setBusyDelete(true);
    setError('');
    try {
      await api(`/users/${deleteTarget.id}`, json('DELETE'));
      setMessage(t('userDeleted'));
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(translateError(e, language));
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
        <h1 style={{ margin: 0 }}>{t('admin')}</h1>
        <button onClick={() => { setError(''); setMessage(''); setShowAdd(true); }}>
          + {t('addLecturer')}
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="notice" role="status">{message}</p>}

      <section style={{ margin: '1.5rem 0' }}>
        <h2>{t('users')}</h2>
        <div className="list">
          {users.map(u => (
            <UserCard
              key={u.id}
              user={u}
              currentUserId={currentUser?.id || 0}
              onToggle={toggleUser}
              onReset={setResetTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      </section>

      {/* Global Academic Branding Settings */}
      <section style={{ margin: '2rem 0' }}>
        <h2>🏛️ {t('academicBranding')}</h2>
        <p style={{ color: '#555', fontSize: '.9rem', margin: '0 0 1rem 0' }}>
          {language === 'el'
            ? 'Ορίστε τα επίσημα στοιχεία του ιδρύματος και το λογότυπο που θα εμφανίζονται σε όλες τις προβολές.'
            : 'Set the official university branding and logo that appears across all views.'}
        </p>

        <div className="card" style={{ maxWidth: 640 }}>
          <form onSubmit={async e => {
            e.preventDefault();
            setError('');
            try {
              await api('/branding', json('PUT', brand));
              setMessage(t('brandingUpdated'));
              load();
            } catch (err) {
              setError(translateError(err, language));
            }
          }}>
            <LogoUpload
              saved={b => { setBrand(b); setMessage(t('brandingUpdated')); }}
              failed={e => setError(translateError(e, language))}
            />

            <label>
              {language === 'el' ? 'Όνομα Ιδρύματος (Ελληνικά)' : 'University Name (Greek)'}
              <input
                value={getBrandingText(brand.university_name, 'el')}
                onChange={e => setBrand({
                  ...brand,
                  university_name: {
                    el: e.target.value,
                    en: getBrandingText(brand.university_name, 'en')
                  }
                })}
              />
            </label>

            <label>
              {language === 'el' ? 'Όνομα Ιδρύματος (English)' : 'University Name (English)'}
              <input
                value={getBrandingText(brand.university_name, 'en')}
                onChange={e => setBrand({
                  ...brand,
                  university_name: {
                    el: getBrandingText(brand.university_name, 'el'),
                    en: e.target.value
                  }
                })}
              />
            </label>

            <label>
              {language === 'el' ? 'Όνομα Σχολής / Τμήματος (Ελληνικά)' : 'Faculty / School Name (Greek)'}
              <input
                value={getBrandingText(brand.school_name, 'el')}
                onChange={e => setBrand({
                  ...brand,
                  school_name: {
                    el: e.target.value,
                    en: getBrandingText(brand.school_name, 'en')
                  }
                })}
              />
            </label>

            <label>
              {language === 'el' ? 'Όνομα Σχολής / Τμήματος (English)' : 'Faculty / School Name (English)'}
              <input
                value={getBrandingText(brand.school_name, 'en')}
                onChange={e => setBrand({
                  ...brand,
                  school_name: {
                    el: getBrandingText(brand.school_name, 'el'),
                    en: e.target.value
                  }
                })}
              />
            </label>

            <div style={{ marginTop: '1rem' }}>
              <button type="submit">{t('saveBranding')}</button>
            </div>
          </form>
        </div>
      </section>

      {/* Global Academic Periods & Academic Structure Cascade Removal Panel */}
      <AdminRemovalPanel reloadUsers={load} />

      {/* Danger Zone */}
      <section style={{ margin: '3rem 0 1.5rem 0', borderTop: '2px dashed #fca5a5', paddingTop: '1.5rem' }}>
        <h2 style={{ color: '#b91c1c' }}>⚠️ {t('dangerZone')}</h2>
        <div className="card" style={{ borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <b style={{ color: '#991b1b', fontSize: '1.05rem' }}>{t('resetDatabase')}</b>
            <p style={{ margin: '.3rem 0 0 0', color: '#666', fontSize: '.9rem' }}>
              {t('resetDatabaseWarning')}
            </p>
          </div>
          <button
            type="button"
            className="danger"
            onClick={() => setShowResetDbModal(true)}
            style={{ fontWeight: 600 }}
          >
            🗑️ {t('resetDatabase')}
          </button>
        </div>
      </section>

      {showAdd && (
        <UserForm
          close={() => setShowAdd(false)}
          saved={() => { setShowAdd(false); setMessage(t('userCreated')); load(); }}
          failed={e => setError(translateError(e, language))}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          close={() => setResetTarget(null)}
          done={() => { setMessage(t('resetPasswordSuccess')); setResetTarget(null); load(); }}
          failed={e => setError(translateError(e, language))}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          busy={busyDelete}
          close={() => setDeleteTarget(null)}
          confirmDelete={handleDeleteUser}
        />
      )}

      <ResetDbModal
        show={showResetDbModal}
        onConfirm={handleResetDb}
        onCancel={() => setShowResetDbModal(false)}
      />
    </Layout>
  );
}
