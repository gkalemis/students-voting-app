import React, { useState, useEffect } from 'react';
import { api, json } from '../../api';
import { useT } from '../../context/LocaleContext';
import { PollsListSection } from '../polls/PollsListSection';
import { PollCreateModal } from '../polls/PollCreateModal';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface Props {
  courses: any[];
  periods: any[];
  onNotice: (msg: string) => void;
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  onPollsLoaded?: (count: number) => void;
}

export function PollsDashboardContainer({
  courses,
  periods,
  onNotice,
  showCreateModal,
  onCloseCreateModal,
  onPollsLoaded
}: Props) {
  const { t, language } = useT();
  const [polls, setPolls] = useState<any[]>([]);
  const [internalCreate, setInternalCreate] = useState(false);
  const [editingPoll, setEditingPoll] = useState<any | null>(null);
  const [pollToDelete, setPollToDelete] = useState<any | null>(null);

  useEscapeKey(() => setPollToDelete(null), Boolean(pollToDelete));

  const loadPolls = () => {
    api('/polls')
      .then(list => {
        setPolls(list);
        onPollsLoaded?.(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const isModalOpen = Boolean(showCreateModal || internalCreate || editingPoll);
  const closeModal = () => {
    if (onCloseCreateModal) onCloseCreateModal();
    setInternalCreate(false);
    setEditingPoll(null);
  };

  const handleOpenEdit = async (p: any) => {
    try {
      const full = await api(`/polls/${p.id}`);
      setEditingPoll(full);
    } catch {
      setEditingPoll(p);
    }
  };

  const handleDelete = async () => {
    if (!pollToDelete) return;
    try {
      await api(`/polls/${pollToDelete.id}`, json('DELETE'));
      onNotice(t('deleted'));
      setPollToDelete(null);
      loadPolls();
    } catch {
      setPollToDelete(null);
    }
  };

  return (
    <>
      <PollsListSection
        polls={polls}
        onOpenCreate={() => {
          setEditingPoll(null);
          setInternalCreate(true);
        }}
        onEditPoll={handleOpenEdit}
        onDeletePoll={p => setPollToDelete(p)}
      />

      {isModalOpen && (
        <PollCreateModal
          courses={courses}
          periods={periods}
          initialPoll={editingPoll || undefined}
          onClose={closeModal}
          onSuccess={() => {
            const wasEdit = Boolean(editingPoll);
            closeModal();
            onNotice(
              wasEdit
                ? (language === 'el' ? 'Το Quiz ενημερώθηκε με επιτυχία!' : 'Quiz updated successfully!')
                : (language === 'el' ? 'Το Quiz δημιουργήθηκε με επιτυχία!' : 'Quiz created successfully!')
            );
            loadPolls();
          }}
        />
      )}

      {pollToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setPollToDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card modal-dialog" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c' }}>⚠️ {t('delete')}</h3>
            <p style={{ margin: '0 0 1.25rem 0', color: '#475569', fontSize: '0.95rem' }}>
              {language === 'el' ? `Είστε σίγουροι ότι θέλετε να διαγράψετε το «${pollToDelete.title}»;` : `Are you sure you want to delete "${pollToDelete.title}"?`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setPollToDelete(null)} className="outline" style={{ width: 'auto' }}>{t('cancel')}</button>
              <button type="button" onClick={handleDelete} className="danger" style={{ width: 'auto' }}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
