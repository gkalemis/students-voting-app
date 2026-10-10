import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';
import { BrandHeader } from '../components/BrandHeader';
import { UserForm, LogoUpload } from '../components/AdminForms';
import { ResetPasswordModal, DeleteUserModal } from '../components/AdminModals';
import { AdminRemovalPanel } from '../components/AdminRemovalPanel';
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
            <div className="user-card" key={u.id}>
              <div className="user-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: '1.05rem', color: '#0f172a' }}>{u.full_name}</b>
                  <span style={{ color: '#64748b', fontSize: '.88rem' }}>({u.username})</span>
                </div>
                <div className="user-badges">
                  <span className={`badge-role ${u.role === 'ADMIN' ? 'admin' : ''}`}>
                    {u.role === 'ADMIN' ? `🛡️ ${t('admin')}` : `🎓 ${t('lecturer')}`}
                  </span>
                  <span className={`badge-status ${u.active ? 'active' : 'inactive'}`}>
                    {u.active ? `● ${t('active')}` : `○ ${t('inactive')}`}
                  </span>
                  {u.must_change_password && (
                    <span className="badge-must-change" title={t('mustChangeNextLogin')}>
                      ⚠️ {t('mustChangeNextLogin')}
                    </span>
                  )}
                </div>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={u.id === currentUser?.id}
                  onClick={() => toggleUser(u)}
                  title={u.id === currentUser?.id ? t('cannotDeactivateSelf') : ''}
                >
                  {u.active ? t('deactivate') : t('reactivate')}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => { setError(''); setResetTarget(u); }}
                  title={t('resetPasswordTitle')}
                >
                  🔑 {t('resetPassword')}
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={u.id === currentUser?.id}
                  onClick={() => { setError(''); setDeleteTarget(u); }}
                  title={u.id === currentUser?.id ? t('cannotDeleteSelf') : ''}
                >
                  🗑️ {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AdminRemovalPanel users={users} reloadUsers={load} />

      <h2>{t('branding')}</h2>
      <LogoUpload
        saved={x => { setBrand(x); setMessage(t('logoUploaded')); }}
        failed={e => setError(translateError(e, language))}
      />

      <form
        className="card form-grid"
        onSubmit={async e => {
          e.preventDefault();
          setError('');
          try {
            await api('/branding', json('PUT', brand));
            setMessage(t('saved'));
          } catch (e) {
            setError(translateError(e, language));
          }
        }}
      >
        {(() => {
          const univVal = getBrandingText(brand.university_name, language);
          const schoolVal = getBrandingText(brand.school_name, language);
          const deptVal = getBrandingText(brand.department_name, language);
          return (
            <>
              <label>
                {t('universityName')}
                <input
                  value={univVal}
                  onChange={e => {
                    const val = e.target.value;
                    const cur = brand.university_name;
                    const updated = typeof cur === 'object' && cur !== null ? { ...cur, [language]: val } : { el: val, en: val };
                    setBrand({ ...brand, university_name: updated });
                  }}
                />
              </label>
              <label>
                {t('schoolName')}
                <input
                  value={schoolVal}
                  onChange={e => {
                    const val = e.target.value;
                    const cur = brand.school_name;
                    const updated = typeof cur === 'object' && cur !== null ? { ...cur, [language]: val } : { el: val, en: val };
                    setBrand({ ...brand, school_name: updated });
                  }}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                {t('departmentName')}
                <input
                  value={deptVal}
                  onChange={e => {
                    const val = e.target.value;
                    const cur = brand.department_name;
                    const updated = typeof cur === 'object' && cur !== null ? { ...cur, [language]: val } : { el: val, en: val };
                    setBrand({ ...brand, department_name: updated });
                  }}
                />
              </label>
            </>
          );
        })()}
        <div style={{ gridColumn: '1 / -1' }}>
          <button>{t('save')}</button>
        </div>
        <div className="preview">
          <BrandHeader brand={brand} />
        </div>
      </form>

      <section style={{ margin: '2.5rem 0', padding: '1.75rem', background: '#fff', border: '1px solid #fecaca', borderRadius: '14px', boxShadow: '0 4px 12px #dc26260a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#dc2626' }}>⚠️</div>
          <div>
            <h2 style={{ color: '#991b1b', margin: 0, fontSize: '1.15rem' }}>{t('resetDatabase')}</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{t('resetDatabasePrompt')}</p>
          </div>
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            className="danger"
            onClick={() => setShowResetDbModal(true)}
            style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
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
          done={() => {
            setResetTarget(null);
            setMessage(t('resetPasswordSuccess'));
            load();
          }}
          failed={(e: any) => setError(translateError(e, language))}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          close={() => setDeleteTarget(null)}
          confirmDelete={handleDeleteUser}
          busy={busyDelete}
        />
      )}

      {showResetDbModal && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setShowResetDbModal(false)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', padding: '2rem', borderRadius: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem auto', borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                ⚠️
              </div>
              <h3 style={{ color: '#991b1b', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{t('resetDatabase')}</h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                {t('confirmResetDb')}
              </p>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem', color: '#b45309', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textAlign: 'left' }}>
              <span>⚠️</span>
              <span>{t('resetDatabasePrompt')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="secondary" onClick={() => setShowResetDbModal(false)} style={{ padding: '0.6rem 1.2rem' }}>
                {t('cancel')}
              </button>
              <button type="button" className="danger" onClick={handleResetDb} style={{ padding: '0.6rem 1.4rem', fontWeight: 700 }}>
                🗑️ {t('resetDatabase')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
