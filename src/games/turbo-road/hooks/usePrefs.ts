/* Control preferences (steering mode), persisted via the SDK store under
   `kg:turbo-road:prefs`. Mirrors the useGarage store pattern: a synchronous
   ref so mutators never read stale state, live-synced across instances. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { DEFAULT_PREFS } from '../constants';
import type { ControlMode, PrefsState } from '../types';

const prefsStore = createStore<PrefsState>('turbo-road:prefs', DEFAULT_PREFS);

export function usePrefs(): {
  prefs: PrefsState;
  setControl: (mode: ControlMode) => void;
} {
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT_PREFS);
  const latest = useRef<PrefsState>(prefs);

  useEffect(() => {
    let mounted = true;
    prefsStore.get().then((p) => {
      if (!mounted) return;
      latest.current = p;
      setPrefs(p);
    });
    const unsubscribe = prefsStore.subscribe((p) => {
      latest.current = p;
      setPrefs(p);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const setControl = useCallback((mode: ControlMode) => {
    if (latest.current.control === mode) return;
    const next = { ...latest.current, control: mode };
    latest.current = next;
    setPrefs(next);
    prefsStore.set(next).catch(() => {});
  }, []);

  return { prefs, setControl };
}
