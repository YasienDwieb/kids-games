/**
 * When Mouse Maze shows the ghost hand along the route. The hand gives the way
 * away, so a child has to be struggling, not just thinking:
 *
 *   - first play ever: the hand teaches dragging the mouse (until the first step)
 *   - after BUMPS_FOR_HELP wall bumps in this maze, once the child goes quiet
 *   - after BUMPS_NOW wall bumps, straight away (still banging into walls)
 *
 * Going quiet without bumping only says the prompt again. Following the hand
 * (a real step while it shows) clears the bump count, so the hand goes away.
 * Shared by the standalone game and the journey unit.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { currentLanguage, useFirstRun, useIdle, useSpeech } from '@/sdk';
import { mazePhrase } from '../phrase';

export const BUMPS_FOR_HELP = 3;
export const BUMPS_NOW = 6;

type MazeHelpOptions = {
  /** False once the maze is solved (or not on screen yet). */
  active: boolean;
  /** Changes for every new maze; the bump count starts again. */
  mazeKey: unknown;
  /** Quiet time before the prompt repeats (or the hand shows, when struggling). */
  idleMs: number;
};

export function useMazeHelp({ active, mazeKey, idleMs }: MazeHelpOptions) {
  const { speak } = useSpeech();
  const firstRun = useFirstRun('mouse-maze');
  const { idle, poke } = useIdle(idleMs, active, 'mouse-maze');
  const [bumps, setBumps] = useState(0);

  useEffect(() => setBumps(0), [mazeKey]);

  const showDemo =
    active && (firstRun.status === 'show' || (bumps >= BUMPS_FOR_HELP && idle) || bumps >= BUMPS_NOW);

  // Quiet but not struggling: just ask again.
  const struggling = useRef(false);
  struggling.current = bumps >= BUMPS_FOR_HELP;
  useEffect(() => {
    if (active && idle && !struggling.current) void speak(mazePhrase(currentLanguage()));
  }, [active, idle, speak]);

  const showing = useRef(showDemo);
  showing.current = showDemo;
  const { status, complete } = firstRun;

  /** Call on every successful step. */
  const onStep = useCallback(() => {
    poke();
    if (status === 'show') complete();
    if (showing.current) setBumps(0);
  }, [poke, status, complete]);

  /** Call on every wall bump. */
  const onBump = useCallback(() => {
    poke();
    setBumps((n) => n + 1);
  }, [poke]);

  return { showDemo, onStep, onBump };
}
