import { useCallback, useEffect, useState } from 'react';
import { createStore } from '@/sdk';
import { CHALLENGES, COLORS } from '../constants';
import { isChallengeMet } from '../utils';
import type { Challenge } from '../types';

const challengeStore = createStore('color-mixer-challenges', {
  completedChallenges: [] as string[],
});

export function useChallengeMode() {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  useEffect(() => {
    challengeStore.get()
      // createStore.get() returns stored JSON as-is and does NOT backfill new
      // default keys, so guard every key with `?? []` for older saved data.
      .then((s) => setCompletedChallenges(s.completedChallenges ?? []))
      .catch((e) => console.error('Failed to load challenge progress:', e));
  }, []);

  const selectChallenge = useCallback((challenge: Challenge) => {
    setCurrentChallenge(challenge);
  }, []);

  const clearChallenge = useCallback(() => setCurrentChallenge(null), []);

  const checkChallengeComplete = useCallback(
    (mixHex: string | null): boolean => {
      if (!currentChallenge) return false;
      return isChallengeMet(mixHex, COLORS[currentChallenge.targetColor].hex);
    },
    [currentChallenge],
  );

  const markChallengeComplete = useCallback(() => {
    if (!currentChallenge) return;
    setCompletedChallenges((prev) => {
      if (prev.includes(currentChallenge.id)) return prev;
      const updated = [...prev, currentChallenge.id];
      challengeStore.set({ completedChallenges: updated }).catch((e) =>
        console.error('Failed to save challenge progress:', e),
      );
      return updated;
    });
    setCurrentChallenge(null);
  }, [currentChallenge]);

  return {
    challenges: CHALLENGES,
    currentChallenge,
    completedChallenges,
    selectChallenge,
    clearChallenge,
    checkChallengeComplete,
    markChallengeComplete,
  };
}
