import React, { useState, useEffect, useCallback } from 'react';
import { api, json } from '../../api';
import { safeStorage } from '../../utils/storage';
import { MobilePollViewport } from './MobilePollViewport';

interface Props {
  poll: any;
  publicId: string;
  loadPoll: () => void;
}

export function StudentPollController({ poll, publicId, loadPoll }: Props) {
  const q = poll.active_question;
  const storageKey = q ? `poll_ans_${publicId}_q_${q.id}` : '';
  const tokenKey = `poll_vtoken_${publicId}`;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voterToken, setVoterToken] = useState('');

  const ensureVoterToken = useCallback(async (forceNew = false): Promise<string> => {
    if (!forceNew) {
      try {
        const saved = JSON.parse(safeStorage.getItem(tokenKey) || 'null');
        if (saved?.token && saved?.expires_at && new Date(saved.expires_at) > new Date()) {
          setVoterToken(saved.token);
          return saved.token;
        }
      } catch {}
    }
    const issued = await api(`/public/polls/${encodeURIComponent(publicId)}/tokens`, json('POST'));
    safeStorage.setItem(tokenKey, JSON.stringify(issued));
    setVoterToken(issued.token);
    return issued.token;
  }, [publicId, tokenKey]);

  useEffect(() => {
    if (poll?.status === 'ACTIVE') {
      ensureVoterToken().catch(() => {});
    }
  }, [poll?.status, ensureVoterToken]);

  useEffect(() => {
    if (!storageKey) {
      setSelectedIndex(null);
      setHasSubmitted(false);
      return;
    }
    const saved = safeStorage.getItem(storageKey);
    if (saved !== null && saved !== undefined && saved !== '') {
      setSelectedIndex(Number(saved));
      setHasSubmitted(true);
    } else {
      setSelectedIndex(null);
      setHasSubmitted(false);
    }
  }, [storageKey]);

  const handleSelect = async (idx: number) => {
    if (!q || q.status !== 'OPEN' || submitting) return;
    setSelectedIndex(idx);
    setSubmitting(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(20); } catch {}
    }

    const sendVote = async (tok: string) =>
      api(`/public/polls/${encodeURIComponent(publicId)}/answer`, {
        ...json('POST', { question_id: q.id, selected_index: idx }),
        headers: { 'X-Participation-Token': tok }
      });

    try {
      const tok = voterToken || await ensureVoterToken();
      try {
        await sendVote(tok);
      } catch (err: any) {
        if (err?.status === 401) {
          const fresh = await ensureVoterToken(true);
          await sendVote(fresh);
        } else {
          throw err;
        }
      }
      safeStorage.setItem(storageKey, String(idx));
      setHasSubmitted(true);
      loadPoll();
    } catch {
      // Revert visual selection if needed on next poll sync
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobilePollViewport
      poll={poll}
      selectedIndex={selectedIndex}
      onSelectOption={handleSelect}
      hasSubmitted={hasSubmitted}
      submitting={submitting}
    />
  );
}
