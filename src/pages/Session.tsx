import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api, json, connect } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';
import { QrModal, EditModal, CompleteModal } from '../components/SessionModals';
import { SessionEditorModal } from '../components/SessionEditorModal';
import { SessionHeader } from '../components/session/SessionHeader';
import { QuickAddPresenter } from '../components/session/QuickAddPresenter';
import { PresentationList } from '../components/session/PresentationList';
import { ResultsExportSection } from '../components/session/ResultsExportSection';
import { ArchivePromptModal } from '../components/session/ArchivePromptModal';
import { ConcurrencyLockModal } from '../components/dashboard/ConcurrencyLockModal';
import { DeleteSessionModal, DeletePresenterModal } from '../components/session/DeleteModals';
import { useSessionActions } from '../hooks/useSessionActions';

export function Session() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useT();
  const [s, setS] = useState<any>(null);
  const [loadErr, setLoadErr] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const promptDismissedRef = useRef(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const loadRef = useRef<() => void>(() => {});

  const actions = useSessionActions({
    id,
    language,
    t,
    s,
    setS,
    load: () => loadRef.current(),
    navigate
  });

  const load = useCallback(() => {
    api(`/sessions/${id}`)
      .then(data => {
        setLoadErr('');
        setS(data);
        if (data.status === 'COMPLETED' && !data.results_revealed && !data.archive_snapshot && !promptDismissedRef.current) {
          setShowArchivePrompt(true);
        }
      })
      .catch(e => {
        const msg = translateError(e, language);
        setLoadErr(msg);
      });
  }, [id, language]);

  loadRef.current = load;

  useEffect(() => {
    promptDismissedRef.current = false;
    load();
  }, [load]);

  // Connect WebSocket once per public_id to avoid tearing down and reconnecting every poll cycle
  useEffect(() => {
    if (!s?.public_id) return;
    return connect(s.public_id, () => loadRef.current());
  }, [s?.public_id]);

  // Fallback polling only while voting is actively open
  const hasVoting = Boolean(s?.presentations?.some((p: any) => p.status === 'VOTING_OPEN'));
  useEffect(() => {
    if (!s?.public_id || !hasVoting) return;
    const interval = setInterval(() => loadRef.current(), 2500);
    return () => clearInterval(interval);
  }, [s?.public_id, hasVoting]);

  if (!s) {
    return (
      <Layout>
        {loadErr ? (
          <div className="card" style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>{t('sessionOrPollNotFound')}</h2>
            <p style={{ color: '#475569', marginBottom: '1.25rem' }}>{loadErr}</p>
            <Link to="/dashboard" className="button primary">
              ← {t('backToDashboard')}
            </Link>
          </div>
        ) : (
          <p>{t('loading')}</p>
        )}
      </Layout>
    );
  }

  const isArchived = s.status === 'ARCHIVED';
  const fullJoinUrl = `${window.location.origin}/join/${s.public_id}`;

  const allPresentationsFinished = Boolean(
    s.status === 'ACTIVE' &&
    s.presentations &&
    s.presentations.length > 0 &&
    s.presentations.every((p: any) => p.status === 'EVALUATED' || p.status === 'SKIPPED' || p.status === 'NO_VOTES')
  );

  return (
    <Layout>
      <SessionHeader
        session={s}
        onActivate={actions.handleActivate}
        onOpenEditor={() => setShowEditorModal(true)}
        onShowComplete={() => setShowCompleteModal(true)}
        onShowQr={() => setShowQrModal(true)}
        onShowArchive={() => actions.handleArchive(() => {})}
        onShowDelete={() => setShowDeleteModal(true)}
        archiving={actions.archiving}
      />

      {actions.err && <p className="error" role="alert">{actions.err}</p>}
      {actions.toastMsg && <p className="notice" role="status">{actions.toastMsg}</p>}

      {allPresentationsFinished && (
        <div className="card" style={{ background: '#ecfdf5', borderColor: '#6ee7b7', margin: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.25rem', borderRadius: 12 }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#065f46', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>🎉</span>
              <span>{t('allPresentationsEvaluated')}</span>
            </h3>
            <p style={{ margin: 0, color: '#047857', fontSize: '0.88rem' }}>
              {t('endSessionHint')}
            </p>
          </div>
          <button
            type="button"
            className="danger"
            onClick={() => setShowCompleteModal(true)}
            style={{ fontWeight: 600, padding: '0.55rem 1.2rem', fontSize: '0.95rem' }}
          >
            ⏹️ {t('endSession')}
          </button>
        </div>
      )}

      {(s.status === 'COMPLETED' || isArchived) && (
        <ResultsExportSection sessionId={id} results={s.results} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <h2 style={{ margin: 0 }}>{t('presentations')}</h2>
        {!isArchived && s.status !== 'COMPLETED' && (
          <span style={{ fontSize: '.82rem', color: '#64748b' }}>
            ℹ️ {t('onlyUpcomingNotice')}
          </span>
        )}
      </div>

      {!isArchived && s.status !== 'COMPLETED' && (
        <QuickAddPresenter
          name={actions.newPresenterName}
          topic={actions.newPresenterTopic}
          isAdding={actions.isAddingPresenter}
          onNameChange={actions.setNewPresenterName}
          onTopicChange={actions.setNewPresenterTopic}
          onSubmit={actions.handleQuickAdd}
        />
      )}

      <PresentationList
        presentations={s.presentations}
        sessionStatus={s.status}
        isArchived={isArchived}
        onMove={actions.handleMoveUpcoming}
        onEdit={setEdit}
        onDelete={actions.setPresToDelete}
        onAct={actions.act}
      />

      {showQrModal && (
        <QrModal
          fullJoinUrl={fullJoinUrl}
          copied={copied}
          copyUrl={() => {
            navigator.clipboard.writeText(fullJoinUrl).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }).catch(() => {});
          }}
          close={() => setShowQrModal(false)}
        />
      )}

      {edit && (
        <EditModal
          item={edit}
          save={async (x: any) => {
            await api(`/sessions/${id}/presentations/${edit.id}`, json('PUT', x));
            setEdit(null);
            load();
          }}
          close={() => setEdit(null)}
        />
      )}

      {showCompleteModal && (
        <CompleteModal
          confirmComplete={() => {
            setShowCompleteModal(false);
            actions.act('complete');
          }}
          close={() => setShowCompleteModal(false)}
        />
      )}

      <ArchivePromptModal
        show={showArchivePrompt}
        onReveal={async () => {
          promptDismissedRef.current = true;
          if (await actions.act('reveal')) {
            setShowArchivePrompt(false);
          } else {
            promptDismissedRef.current = false;
          }
        }}
      />

      <ConcurrencyLockModal lock={actions.concurrencyLock} onClose={() => actions.setConcurrencyLock(null)} />
      <DeleteSessionModal show={showDeleteModal} sessionTitle={s.title || s.session_date} onConfirm={() => actions.handleDeleteSession(() => setShowDeleteModal(false))} onCancel={() => setShowDeleteModal(false)} />
      <DeletePresenterModal item={actions.presToDelete} onConfirm={actions.handleConfirmDeletePres} onCancel={() => actions.setPresToDelete(null)} />

      {showEditorModal && (
        <SessionEditorModal
          sessionId={Number(id)}
          onClose={() => setShowEditorModal(false)}
          onSaved={() => {
            actions.setToastMsg(t('sessionUpdatedSuccess'));
            load();
          }}
        />
      )}
    </Layout>
  );
}
