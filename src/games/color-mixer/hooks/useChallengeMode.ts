import { useCallback, useState } from 'react';
import { CHALLENGES } from '../constants';
import type { Challenge, ColorId } from '../types';

export function useChallengeMode() {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  const selectChallenge = useCallback((challenge: Challenge) => {
    setCurrentChallenge(challenge);
  }, []);

  const clearChallenge = useCallback(() => {
    setCurrentChallenge(null);
  }, []);

  const checkChallengeComplete = useCallback(
    (resultColor: ColorId | null): boolean => {
      if (!currentChallenge || !resultColor) return false;
      return resultColor === currentChallenge.targetColor;
    },
    [currentChallenge],
  );

  const markChallengeComplete = useCallback(() => {
    if (!currentChallenge) return;
    setCompletedChallenges((prev) => {
      if (prev.includes(currentChallenge.id)) return prev;
      return [...prev, currentChallenge.id];
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
