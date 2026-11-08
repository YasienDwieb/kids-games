import { useCallback, useEffect, useRef, useState } from 'react';
import { hintStepFor, starsForMisses, type HintStep } from './hints';

export type UseHintLadderResult = {
  /** Wrong attempts on the current round. */
  misses: number;
  /** Record a wrong attempt; returns the hint step the game should show. */
  miss: () => HintStep;
  /** The hint currently earned (null until the first miss). */
  step: HintStep | null;
  /** True while the round is still clean. */
  firstTry: boolean;
  /** Stars a solve would earn right now. */
  stars: 1 | 2 | 3;
};

/**
 * Per-round miss counter wired to the shared hint policy. Resets whenever
 * `roundKey` changes (pass the level number or round id).
 */
export function useHintLadder(roundKey: unknown): UseHintLadderResult {
  // The ref is the source of truth so miss() can answer synchronously, even
  // when two taps land in the same frame; state only drives re-renders.
  const missesRef = useRef(0);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    missesRef.current = 0;
    setMisses(0);
  }, [roundKey]);

  const miss = useCallback((): HintStep => {
    missesRef.current += 1;
    setMisses(missesRef.current);
    return hintStepFor(missesRef.current);
  }, []);

  return {
    misses,
    miss,
    step: misses > 0 ? hintStepFor(misses) : null,
    firstTry: misses === 0,
    stars: starsForMisses(misses),
  };
}
