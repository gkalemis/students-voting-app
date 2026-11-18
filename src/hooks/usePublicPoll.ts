import { useState, useEffect, useCallback } from 'react';
import { connect } from '../api';

export function usePublicPoll(publicId: string): [any | null, () => void, boolean] {
  const [poll, setPoll] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!publicId) return;
    fetch(`/api/public/polls/${encodeURIComponent(publicId)}`)
      .then(async r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => {
        setPoll(data);
        setLoading(false);
      })
      .catch(() => {
        setPoll(null);
        setLoading(false);
      });
  }, [publicId]);

  const wsChannelId = poll?.public_id || publicId;

  useEffect(() => {
    load();
    if (!wsChannelId) return;
    const cleanup = connect(wsChannelId, () => {
      load();
    });
    const timer = setInterval(load, 2500);
    return () => {
      cleanup();
      clearInterval(timer);
    };
  }, [wsChannelId, load]);

  return [poll, load, loading];
}
