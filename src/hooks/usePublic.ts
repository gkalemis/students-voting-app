import { useState, useEffect, useCallback } from 'react';
import { api, connect } from '../api';
import { State } from '../types';

export function usePublic(publicId: string): [State | null, () => void, boolean] {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!publicId) {
      setLoading(false);
      return;
    }
    api(`/public/sessions/${encodeURIComponent(publicId)}`)
      .then(data => {
        setState(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [publicId]);

  useEffect(() => {
    load();
    if (!publicId) return;
    const cleanup = connect(publicId, () => {
      load();
    });
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [publicId, load]);

  // Secondary backup polling every 2s while a presentation is voting to ensure immediate sync on expiration
  useEffect(() => {
    if (!publicId || !state?.active_presentation) return;
    const timer = setInterval(() => {
      load();
    }, 2000);
    return () => clearInterval(timer);
  }, [publicId, state?.active_presentation?.id, load]);

  return [state, load, loading];
}
