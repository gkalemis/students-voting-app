import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [edit, setEdit] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () =>
    api(`/sessions/${id}`)
      .then(data => {
        setS(data);
        if (data.status === 'COMPLETED' && !data.archive_snapshot && !promptDismissed) {
          setShowArchivePrompt(true);
        }
      })
      .catch(e => actions.setErr(translateError(e, language)));

  const actions = useSessionActions({
    id,
    language,
    t,
    s,
    setS,
    load,
    navigate
  });

  useEffect(() => { load(); }, [id, language]);

  useEffect(() => {
    if (!s?.public_id) return;
    const cleanup = connect(s.public_id, () => { load(); });
    const hasVoting = s.presentations?.some((p: any) => p.status === 'VOTING_OPEN');
    const interval = hasVoting ? setInterval(load, 2000) : undefined;
    return () => {
      cleanup();
      if (interval) clearInterval(interval);
    };
  }, [s?.public_id, s?.presentations]);

  if (!s) return <Layout>{actions.err || t('loading')}</Layout>;

  const isArchived = s.status === 'ARCHIVED';
  const fullJoinUrl = `${window.location.origin}/join/${s.public_id}`;

  return (
    <Layout>
      <SessionHeader
        session={s}
        onActivate={actions.handleActivate}
        onOpenEditor={() => setShowEditorModal(true)}
        onShowComplete={() => setShowCompleteModal(true)}
        onShowQr={() => setShowQrModal(true)}
        onShowArchive={() => setShowArchivePrompt(true)}
        onShowDelete={() => setShowDeleteModal(true)}
        archiving={actions.archiving}
      />

      {actions.err && <p className="error" role="alert">{actions.err}</p>}
      {actions.toastMsg && <p className="notice" role="status">{actions.toastMsg}</p>}

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
        archiving={actions.archiving}
        onArchive={() => actions.handleArchive(() => setShowArchivePrompt(false))}
        onDismiss={() => {
          setShowArchivePrompt(false);
          setPromptDismissed(true);
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
