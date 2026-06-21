import { useCallback, useEffect, useRef, useState } from 'react';
import { useSound } from '../audio/useSound';

/**
 * Shared interaction host for a guided-flow round. Both games' flow adapters
 * render one of their existing round/puzzle components and wire it to this:
 * scoreless, plays the success cue and calls `onComplete` on solve, handles the
 * tap-choice correct/wrong pattern. Keeps the per-game adapters thin.
 */
export function useFlowRound(onComplete: () => void) {
  const { play } = useSound();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const solveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(solveTimer.current);
      clearTimeout(wrongTimer.current);
    },
    [],
  );

  /** Mark solved: success cue, then advance after a short beat. Idempotent. */
  const complete = useCallback(() => {
    if (solved) return;
    setSolved(true);
    void play('success');
    solveTimer.current = setTimeout(onComplete, 450);
  }, [solved, play, onComplete]);

  /** Tap-choice handler: correct → complete; wrong → cue + clear selection. */
  const pick = useCallback(
    (index: number, correctIndex: number) => {
      if (selectedIndex !== null || solved) return;
      setSelectedIndex(index);
      if (index === correctIndex) {
        complete();
      } else {
        void play('wrong');
        wrongTimer.current = setTimeout(() => setSelectedIndex(null), 900);
      }
    },
    [selectedIndex, solved, complete, play],
  );

  return { play, solved, selectedIndex, complete, pick };
}
