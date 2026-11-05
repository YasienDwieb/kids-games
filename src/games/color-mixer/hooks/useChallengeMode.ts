import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { CHALLENGES } from '../constants';
import { endlessChallenge } from '../utils';
import type { Challenge } from '../types';

const challengeStore = createStore('color-mixer-challenges', {
  completedChallenges: [] as string[],
  /** Endless mystery colours solved; the next one is number endlessSolved + 1. */
  endlessSolved: 0,
});

export function useChallengeMode() {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [endlessSolved, setEndlessSolved] = useState(0);
  const saved = useRef({ completedChallenges: [] as string[], endlessSolved: 0 });
  const persist = (next: Partial<typeof saved.current>) => {
    saved.current = { ...saved.current, ...next };
    challengeStore.set(saved.current).catch((e) => console.error('Failed to save challenge progress:', e));
  };

  useEffect(() => {
    challengeStore.get()
      // createStore.get() returns stored JSON as-is and does NOT backfill new
      // default keys, so guard every key with `?? []` for older saved data.
      .then((s) => {
        saved.current = { completedChallenges: s.completedChallenges ?? [], endlessSolved: s.endlessSolved ?? 0 };
        setCompletedChallenges(saved.current.completedChallenges);
        setEndlessSolved(saved.current.endlessSolved);
      })
      .catch((e) => console.error('Failed to load challenge progress:', e));
  }, []);

  const selectChallenge = useCallback((challenge: Challenge) => {
    setCurrentChallenge(challenge);
  }, []);

  const clearChallenge = useCallback(() => setCurrentChallenge(null), []);

  /**
   * Record the current challenge as done. Returns the next endless challenge when the
   * finished one was endless (so play rolls straight on), else null.
   */
  const markChallengeComplete = useCallback((): Challenge | null => {
    if (!currentChallenge) return null;
    if (currentChallenge.endless) {
      const solved = saved.current.endlessSolved + 1;
      setEndlessSolved(solved);
      persist({ endlessSolved: solved });
      const next = endlessChallenge(solved + 1);
      setCurrentChallenge(next);
      return next;
    }
    if (!saved.current.completedChallenges.includes(currentChallenge.id)) {
      const updated = [...saved.current.completedChallenges, currentChallenge.id];
      setCompletedChallenges(updated);
      persist({ completedChallenges: updated });
    }
    setCurrentChallenge(null);
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChallenge]);

  return {
    challenges: CHALLENGES,
    currentChallenge,
    completedChallenges,
    endlessSolved,
    /** The next mystery colour in the endless pool. */
    nextEndless: endlessChallenge(endlessSolved + 1),
    selectChallenge,
    clearChallenge,
    markChallengeComplete,
  };
}
