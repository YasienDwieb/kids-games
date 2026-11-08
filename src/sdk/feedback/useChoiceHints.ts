import { useCallback, useEffect, useState } from 'react';
import { useHintLadder } from './useHintLadder';

/**
 * The hint ladder for tap-the-answer rounds. `miss(correct)` records a wrong
 * pick and returns a function to call once the wrong pick has cleared: from the
 * 2nd miss on, `hintIndex` keeps pointing at the answer; on the 3rd,
 * `revealCorrect` turns the answer green as the wrong pick flashes.
 */
export function useChoiceHints(roundKey: unknown) {
  const hints = useHintLadder(roundKey);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [revealCorrect, setRevealCorrect] = useState(false);

  useEffect(() => {
    setHintIndex(null);
    setRevealCorrect(false);
  }, [roundKey]);

  const { miss: ladderMiss } = hints;
  const miss = useCallback(
    (correctIndex: number) => {
      const step = ladderMiss();
      setRevealCorrect(step === 'reveal');
      return () => {
        if (step !== 'retry') setHintIndex(correctIndex);
      };
    },
    [ladderMiss],
  );

  return { misses: hints.misses, firstTry: hints.firstTry, miss, hintIndex, revealCorrect };
}
