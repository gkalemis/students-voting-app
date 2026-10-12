import { useState } from 'react';
import { api, json } from '../api';
import { translateError, Language } from '../i18n';

interface UseSessionActionsProps {
  id: string;
  language: Language;
  t: (key: any) => string;
  s: any;
  setS: React.Dispatch<React.SetStateAction<any>>;
  load: () => void;
  navigate: (path: string) => void;
}

export function useSessionActions({
  id,
  language,
  t,
  s,
  setS,
  load,
  navigate
}: UseSessionActionsProps) {
  const [toastMsg, setToastMsg] = useState('');
  const [err, setErr] = useState('');
  const [concurrencyLock, setConcurrencyLock] = useState<any>(null);
  const [archiving, setArchiving] = useState(false);
  const [isAddingPresenter, setIsAddingPresenter] = useState(false);
  const [newPresenterName, setNewPresenterName] = useState('');
  const [newPresenterTopic, setNewPresenterTopic] = useState('');
  const [presToDelete, setPresToDelete] = useState<any>(null);

  const act = async (path: string, body?: any) => {
    setErr('');
    try {
      await api(`/sessions/${id}/${path}`, json('POST', body));
      load();
    } catch (e: any) {
      if (e?.error === 'SESSION_CONCURRENCY_LOCK' || e?.status === 409) {
        setConcurrencyLock(e);
      } else {
        setErr(translateError(e, language));
      }
    }
  };

  const handleActivate = async () => {
    setErr('');
    try {
      await api(`/sessions/${id}/activate`, json('POST'));
      setToastMsg(language === 'el' ? 'Η συνεδρία ενεργοποιήθηκε!' : 'Session activated!');
      load();
    } catch (e: any) {
      if (e?.error === 'SESSION_CONCURRENCY_LOCK' || e?.status === 409) {
        setConcurrencyLock(e);
      } else {
        setErr(translateError(e, language));
      }
    }
  };

  const handleArchive = async (onClosePrompt: () => void) => {
    setArchiving(true);
    setErr('');
    try {
      await api(`/sessions/${id}/archive`, json('POST'));
      onClosePrompt();
      setToastMsg(language === 'el' ? 'Η συνεδρία αρχειοθετήθηκε και η ομάδα αποσύρθηκε!' : 'Session archived and group retired!');
      load();
    } catch (e: any) {
      setErr(translateError(e, language));
    } finally {
      setArchiving(false);
    }
  };

  const handleDeleteSession = async (onCloseModal: () => void) => {
    try {
      await api(`/sessions/${id}`, json('DELETE'));
      navigate('/');
    } catch (e: any) {
      setErr(translateError(e, language));
      onCloseModal();
    }
  };

  const handleMoveUpcoming = async (p: any, direction: 'UP' | 'DOWN') => {
    if (p.status !== 'PENDING') return;
    const pending = (s?.presentations || []).filter((x: any) => x.status === 'PENDING');
    const pendingIdx = pending.findIndex((x: any) => x.id === p.id);
    if (direction === 'UP' && pendingIdx <= 0) return;
    if (direction === 'DOWN' && pendingIdx >= pending.length - 1) return;

    const otherP = direction === 'UP' ? pending[pendingIdx - 1] : pending[pendingIdx + 1];
    const currIdx = (s?.presentations || []).findIndex((x: any) => x.id === p.id);
    const otherIdx = (s?.presentations || []).findIndex((x: any) => x.id === otherP.id);
    if (currIdx === -1 || otherIdx === -1) return;

    const nextList = [...(s?.presentations || [])];
    const temp = nextList[currIdx];
    nextList[currIdx] = nextList[otherIdx];
    nextList[otherIdx] = temp;
    nextList.forEach((item: any, idx: number) => { item.position = idx; });

    setS((prev: any) => ({ ...prev, presentations: nextList }));
    try {
      await api(`/sessions/${id}/presentations/reorder`, json('POST', {
        ordered_ids: nextList.map((x: any) => x.id)
      }));
      setToastMsg(t('reorderSuccess'));
    } catch (e: any) {
      setErr(translateError(e, language));
      load();
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresenterName.trim()) return;
    setIsAddingPresenter(true);
    setErr('');
    try {
      await api(`/sessions/${id}/presentations`, json('POST', {
        presenter_name: newPresenterName.trim(),
        title: newPresenterTopic.trim() || undefined
      }));
      setNewPresenterName('');
      setNewPresenterTopic('');
      setToastMsg(t('created'));
      load();
    } catch (e: any) {
      setErr(translateError(e, language));
    } finally {
      setIsAddingPresenter(false);
    }
  };

  const handleConfirmDeletePres = async () => {
    if (!presToDelete) return;
    try {
      await api(`/sessions/${id}/presentations/${presToDelete.id}`, json('DELETE'));
      setPresToDelete(null);
      setToastMsg(language === 'el' ? 'Η παρουσίαση αφαιρέθηκε' : 'Presentation removed');
      load();
    } catch (e: any) {
      setErr(translateError(e, language));
      setPresToDelete(null);
    }
  };

  return {
    toastMsg,
    setToastMsg,
    err,
    setErr,
    concurrencyLock,
    setConcurrencyLock,
    archiving,
    isAddingPresenter,
    newPresenterName,
    setNewPresenterName,
    newPresenterTopic,
    setNewPresenterTopic,
    presToDelete,
    setPresToDelete,
    act,
    handleActivate,
    handleArchive,
    handleDeleteSession,
    handleMoveUpcoming,
    handleQuickAdd,
    handleConfirmDeletePres
  };
}
