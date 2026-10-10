import { useState, useEffect, useCallback } from 'react';
import { api, connect } from '../api';
import { State } from '../types';

export function usePublic(publicId: string): [State | null, () => void] {
  const [state, setState] = useState<State | null>(null);

  const load = useCallback(() => {
    if (!publicId) return;
    api(`/public/sessions/${publicId}`)
      .then(setState)
      .catch(() => {});
  }, [publicId]);

  useEffect(() => {
    load();
    if (!publicId) return;
    const cleanup = connect(publicId, () => {
      load();
    });
    return cleanup;
  }, [publicId, load]);

  return [state, load];
}
