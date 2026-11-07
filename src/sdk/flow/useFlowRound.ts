import { useCallback, useEffect, useRef, useState } from 'react';
import { useSound } from '../audio/useSound';
import { useChoiceHints } from '../feedback/useChoiceHints';
import { useRoundEnd } from '../feedback/useRoundEnd';

/**
 * Shared interaction host for a guided-flow round. Both games' flow adapters
 * render one of their existing round/puzzle components and wire it to this:
 * scoreless, plays the success cue and calls `onComplete` on solve, handles the
 * tap-choice correct/wrong pattern. Keeps the per-game adapters thin.
 */
export function useFlowRound(onComplete: () => void) {
  const { play } = useSound();
  const { next } = useRoundEnd();
  const { miss, hintIndex, revealCorrect } = useChoiceHints(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(wrongTimer.current);
    },
    [],
  );

  /** Mark solved: success cue + confetti, then advance once the praise is over. Idempotent. */
  const complete = useCallback(() => {
    if (solved) return;
    setSolved(true);
    void play('success');
    void next('small', onComplete);
  }, [solved, play, next, onComplete]);

  /** Tap-choice handler: correct → complete; wrong → cue + clear selection. */
  const pick = useCallback(
    (index: number, correctIndex: number) => {
      if (selectedIndex !== null || solved) return;
      setSelectedIndex(index);
      if (index === correctIndex) {
        complete();
      } else {
        void play('wrong');
        const afterClear = miss(correctIndex);
        wrongTimer.current = setTimeout(() => {
          setSelectedIndex(null);
          afterClear();
        }, 900);
      }
    },
    [selectedIndex, solved, complete, play, miss],
  );

  return { play, solved, selectedIndex, complete, pick, hintIndex, revealCorrect };
}
