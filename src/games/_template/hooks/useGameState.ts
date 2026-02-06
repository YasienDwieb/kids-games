import { useState, useCallback } from 'react';

type GameState = {
  isPlaying: boolean;
  score: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

export function useGameState(): GameState {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  const start = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const reset = useCallback(() => {
    setIsPlaying(false);
    setScore(0);
  }, []);

  return { isPlaying, score, start, pause, reset };
}
