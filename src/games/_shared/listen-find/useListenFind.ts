/**
 * useListenFind — shared standalone-game host for the listen-and-find mechanic.
 *
 * Wraps useLevels and owns the per-round interaction state machine that was
 * previously hand-written in letter-land/index.tsx: selection, the solved gate,
 * a single timer ref, score→HUD sync, speak-on-level-change, and the
 * correct/wrong pick handling with the solved overlay.
 *
 * Each game supplies its LevelSource, a `speakTarget` (fired on every level
 * change + on replay), and `renderSolved(isLast, onNext)` so the game keeps its
 * own themed overlay component.
 *
 * Shell-mode only (uses useGameShell). Guided mode uses useFlowRound instead.
 *
 * Determinism: no Math.random / Date.now here; the only timers are short UI
 * cooldowns in one ref, cleared on reassign and unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameShell, useLevels, useSound, type LevelSource } from '@/sdk';
import type { FindItem, FindRound } from './types';

/** The per-level shape both games produce. */
export type ListenFindLevel = {
  readonly level: number;
  readonly round: FindRound & { readonly target: FindItem };
};

// Short post-answer cooldowns (ms) before advancing / clearing a wrong pick.
const SOLVE_DELAY = 700;
const WRONG_RESET_DELAY = 700;

export function useListenFind<L extends ListenFindLevel>(opts: {
  gameId: string;
  source: LevelSource<L>;
  speakTarget: () => void;
  renderSolved: (isLast: boolean, onNext: () => void) => React.ReactNode;
}) {
  const { play } = useSound();
  const shell = useGameShell();
  const levels = useLevels<L>({ gameId: opts.gameId, source: opts.source });
  const { status, data, level, score, isLast, advance, startOver, addScore } = levels;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);

  // Single timer ref — cleared before reassign and on unmount.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setTimer = useCallback((fn: () => void, ms: number) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);

  // Stable handles so the [level]-only effect doesn't re-run on identity churn
  // (react-i18next can hand back a new t, re-speaking mid-level otherwise).
  const speakRef = useRef(opts.speakTarget);
  speakRef.current = opts.speakTarget;
  const shellRef = useRef(shell);
  shellRef.current = shell;
  const renderSolvedRef = useRef(opts.renderSolved);
  renderSolvedRef.current = opts.renderSolved;

  // Keep the shell HUD score in sync.
  useEffect(() => {
    shell.setScore(score);
  }, [score, shell]);

  // On level change ONLY: clear any win overlay, reset selection/solved, speak.
  useEffect(() => {
    shellRef.current.hideOverlay('win');
    setSelectedIndex(null);
    setSolved(false);
    speakRef.current();
  }, [level]);

  // Clear any pending timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // handleNext reads isLast at call time (live closure).
  const handleNext = useCallback(() => {
    shell.hideOverlay('win');
    if (isLast) startOver();
    else advance();
  }, [isLast, advance, startOver, shell]);

  const handlePick = useCallback(
    (idx: number, correctIndex: number) => {
      if (selectedIndex !== null || solved || status !== 'playing') return;
      setSelectedIndex(idx);
      if (idx === correctIndex) {
        // Last level plays the win cue; every other correct pick plays success.
        void play(isLast ? 'win' : 'success');
        addScore(10);
        setSolved(true);
        setTimer(() => {
          shellRef.current.showOverlay('win', renderSolvedRef.current(isLast, handleNext));
        }, SOLVE_DELAY);
      } else {
        void play('wrong');
        setTimer(() => setSelectedIndex(null), WRONG_RESET_DELAY);
      }
    },
    [selectedIndex, solved, status, isLast, play, addScore, setTimer, handleNext],
  );

  return { ...levels, selectedIndex, solved, handlePick, handleNext };
}
