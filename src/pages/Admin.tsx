import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';
import { UserForm } from '../components/AdminForms';
import { ResetPasswordModal, DeleteUserModal } from '../components/AdminModals';
import { AdminRemovalPanel } from '../components/AdminRemovalPanel';
import { UserCard } from '../components/admin/UserCard';
import { ResetDbModal } from '../components/admin/ResetDbModal';
import { AdminBrandingSection } from '../components/admin/AdminBrandingSection';

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
  const [message, setMessageState] = useState('');
  const msgTimerRef = useRef<any>(null);

  const setMessage = (msg: string) => {
    setMessageState(msg);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    if (msg) {
      msgTimerRef.current = setTimeout(() => {
        setMessageState('');
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, []);

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
      <AdminBrandingSection
        brand={brand}
        setBrand={setBrand}
        onSuccess={setMessage}
        onError={setError}
        onReload={load}
      />

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
          >
            {t('resetDatabase')}
          </button>
        </div>
      </section>

      {showAdd && (
        <UserForm
          close={() => setShowAdd(false)}
          saved={() => { setShowAdd(false); setMessage(t('lecturerCreated')); load(); }}
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

      {showResetDbModal && (
        <ResetDbModal
          show={showResetDbModal}
          onCancel={() => setShowResetDbModal(false)}
          onConfirm={handleResetDb}
        />
      )}
    </Layout>
  );
}
