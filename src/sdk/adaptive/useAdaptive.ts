import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createStore } from '@/sdk/storage/createStore';
import { settingsStore } from '@/sdk/settings/store';
import { nextAdaptive, startingTier, type AdaptiveState } from './adaptive';

export type UseAdaptiveResult = {
  /** −2 (easiest) … +2 (hardest); 0 until the saved tier has loaded. */
  tier: number;
  /** Report how an attempt went (a level cleared vs. failed / lots of misses). */
  record: (won: boolean) => void;
};

/**
 * Per-game adaptive tier, persisted under kg:adaptive:<gameId>. The first time a
 * game is played the tier starts from the parent's age band setting.
 */
export function useAdaptive(gameId: string): UseAdaptiveResult {
  const store = useMemo(
    () => createStore<AdaptiveState | null>(`adaptive:${gameId}`, null),
    [gameId],
  );
  const [state, setState] = useState<AdaptiveState>({ tier: 0, wins: 0, losses: 0 });
  const live = useRef(state);

  useEffect(() => {
    let alive = true;
    Promise.all([store.get(), settingsStore.get()]).then(([saved, settings]) => {
      if (!alive) return;
      const initial = saved ?? { tier: startingTier(settings.ageBand), wins: 0, losses: 0 };
      live.current = initial;
      setState(initial);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  const record = useCallback(
    (won: boolean) => {
      const next = nextAdaptive(live.current, won);
      live.current = next;
      setState(next);
      void store.set(next);
    },
    [store],
  );

  return { tier: state.tier, record };
}
