import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Becomes `idle` after `ms` without a `poke()` while `active` is true. Games
 * poke on every meaningful touch and show a hint (e.g. <DemoHand>) when idle,
 * so a stuck child gets help without asking.
 */
export function useIdle(ms: number, active = true): { idle: boolean; poke: () => void } {
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setIdle(true), ms);
  }, [ms]);

  useEffect(() => {
    setIdle(false);
    if (active) arm();
    else if (timer.current) clearTimeout(timer.current);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, arm]);

  const poke = useCallback(() => {
    setIdle(false);
    if (active) arm();
  }, [active, arm]);

  return { idle, poke };
}
