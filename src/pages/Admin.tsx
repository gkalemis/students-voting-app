import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';
import { BrandHeader } from '../components/BrandHeader';
import { UserForm, LogoUpload, BackgroundPalette } from '../components/AdminForms';
import { ResetPasswordModal, DeleteUserModal } from '../components/AdminModals';
import { AdminRemovalPanel } from '../components/AdminRemovalPanel';

export function Admin() {
  const { user: currentUser } = useAuth();
  const { t, language } = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [brand, setBrand] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      <BackgroundPalette brand={brand} setBrand={setBrand} />

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
        <label>
          {t('universityName')}
          <input
            value={brand.university_name || ''}
            onChange={e => setBrand({ ...brand, university_name: e.target.value })}
          />
        </label>
        <label>
          {t('schoolName')}
          <input
            value={brand.school_name || ''}
            onChange={e => setBrand({ ...brand, school_name: e.target.value })}
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          {t('departmentName')}
          <input
            value={brand.department_name || ''}
            onChange={e => setBrand({ ...brand, department_name: e.target.value })}
          />
        </label>
        <div style={{ gridColumn: '1 / -1' }}>
          <button>{t('save')}</button>
        </div>
        <div className="preview">
          <BrandHeader brand={brand} />
        </div>
      </form>

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
    </Layout>
  );
}
