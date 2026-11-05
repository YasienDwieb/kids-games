/**
 * Finger → mouse movement, shared by the 2D and 3D boards. Each renderer turns
 * the touch into the cell under the finger and calls `driveTo(cell)`; the hook
 * steps the mouse there (gliding along straight corridors when a fast drag
 * skips cells), plays the step / pickup / wall sounds, and reports what
 * happened so the renderer can animate it.
 */
import { useRef } from 'react';
import { useSound } from '@/sdk';
import type { StepResult, useMaze } from './useMaze';
import type { Pos } from '../types';

const towards = (from: number, to: number) => from + Math.sign(to - from);

type DriveEvents = {
  /** Called after every successful step (including the one reaching the cheese). */
  onStep?: (res: StepResult) => void;
  /** The mouse ends this drag event on `cell` (animate the move). */
  onMove?: (cell: Pos) => void;
  /** Pushed into a wall from `from` towards `to` (once per wall). */
  onBump: (from: Pos, to: Pos) => void;
};

export function useMazeDrive(maze: ReturnType<typeof useMaze>, events: DriveEvents) {
  const { play } = useSound();
  const lastBump = useRef<string | null>(null);
  // Rebuilt every render and held in a ref, so stable gesture handlers always
  // call the latest closure.
  const drive = useRef<(target: Pos) => void>(() => {});
  drive.current = (target) => {
    const { state, tryStep } = maze;
    if (state.won) return;
    const from = state.player;
    const straight = from.row === target.row || from.col === target.col;
    let last: StepResult | null = null;
    let collected = false;
    let pos = from;
    while (straight && !(pos.row === target.row && pos.col === target.col)) {
      const next: Pos = { row: towards(pos.row, target.row), col: towards(pos.col, target.col) };
      const res = tryStep(next);
      if (res.blocked && last === null) {
        // Pushing into a wall answers with a bump — once per wall, not on every
        // move event while the finger rests there — so it never feels broken.
        const k = `${pos.row},${pos.col}>${next.row},${next.col}`;
        if (lastBump.current !== k) {
          lastBump.current = k;
          play('hit');
          events.onBump(pos, next);
        }
      }
      if (!res.cell) break;
      last = res;
      collected = collected || res.collected;
      pos = res.cell;
      events.onStep?.(res);
      if (res.reachedGoal) break;
    }
    if (!last?.cell) return;
    lastBump.current = null;
    play(collected ? 'success' : 'pop');
    events.onMove?.(last.cell);
  };
  return drive;
}
