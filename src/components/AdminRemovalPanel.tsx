import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';

export function AdminRemovalPanel({
  users: _users, reloadUsers: _reloadUsers
}: {
  users?: any[];
  reloadUsers?: () => void;
}) {
  const { t, language } = useT();
  const [courses, setCourses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ path: string; label: string; verb: 'delete' | 'archive' } | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api('/courses'), api('/periods'), api('/groups'), api('/sessions')])
      .then(([a, b, c, d]) => { setCourses(a); setPeriods(b); setGroups(c); setSessions(d); })
      .catch(e => setError(translateError(e, language)));

  useEffect(() => { load(); }, [language]);

  async function executeRemove() {
    if (!confirmModal) return;
    setBusyAction(true);
    setError('');
    try {
      await api(confirmModal.path, json(confirmModal.verb === 'archive' ? 'POST' : 'DELETE'));
      setMessage(t('actionDone'));
      setConfirmModal(null);
      load();
    } catch (e) {
      setError(translateError(e, language));
    } finally {
      setBusyAction(false);
    }
  }

  const list = (title: string, items: any[], name: (x: any) => string, path: (x: any) => string) => (
    <section>
      <h3>{title}</h3>
      <div className="list">
        {items.length ? (
          items.map(x => (
            <div className="card row" key={x.id}>
              <span>{name(x)}</span>
              <button
                type="button"
                className="danger"
                onClick={() => setConfirmModal({ path: path(x), label: name(x), verb: 'delete' })}
              >
                {t('delete')}
              </button>
            </div>
          ))
        ) : (
          <p>{t('noItems')}</p>
        )}
      </div>
    </section>
  );

  return (
    <section style={{ margin: '2rem 0' }}>
      <h2>{t('removeManagement')}</h2>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="notice" role="status">{message}</p>}

      {list(t('courses'), courses, x => x.name, x => `/courses/${x.id}`)}
      {list(t('periods'), periods, x => x.name, x => `/periods/${x.id}`)}
      {list(t('groups'), groups, x => x.title, x => `/groups/${x.id}`)}

      <section>
        <h3>{t('sessions')}</h3>
        <div className="list">
          {sessions.length ? (
            sessions.map(x => (
              <div className="card row" key={x.id}>
                <span>{x.title || `${t('session')} ${x.session_date}`} · {x.status}</span>
                <div className="actions">
                  {x.status === 'COMPLETED' && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setConfirmModal({ path: `/sessions/${x.id}/archive`, label: x.title || x.session_date, verb: 'archive' })}
                    >
                      {t('archiveAction')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setConfirmModal({ path: `/sessions/${x.id}`, label: x.title || x.session_date, verb: 'delete' })}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>{t('noItems')}</p>
          )}
        </div>
      </section>

      {confirmModal && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="card" style={{ maxWidth: 440 }}>
            <h2>{confirmModal.verb === 'archive' ? t('confirmArchive') : t('confirmDelete')}</h2>
            <p style={{ margin: '.8rem 0', fontSize: '.95rem' }}>
              <b>{confirmModal.label}</b>
            </p>
            <div className="actions" style={{ marginTop: '1.2rem' }}>
              <button
                className={confirmModal.verb === 'archive' ? 'secondary' : 'danger'}
                disabled={busyAction}
                onClick={executeRemove}
              >
                {confirmModal.verb === 'archive' ? t('archiveAction') : t('delete')}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={busyAction}
                onClick={() => setConfirmModal(null)}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
