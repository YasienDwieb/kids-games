import { useCallback, useRef, useState } from 'react';
import { sizeForLevel, STAR_COUNT } from '../constants';
import { canMove, generateMaze, solvePath } from '../utils/maze';
import type { Direction, Grid, Pos } from '../types';

const keyOf = (p: Pos): string => `${p.row},${p.col}`;

/** Direction from `a` to `b` if `b` is exactly one orthogonal cell away, else null. */
function adjacentDir(a: Pos, b: Pos): Direction | null {
  const dRow = b.row - a.row;
  const dCol = b.col - a.col;
  if (dCol === 0 && dRow === -1) return 'up';
  if (dCol === 0 && dRow === 1) return 'down';
  if (dRow === 0 && dCol === -1) return 'left';
  if (dRow === 0 && dCol === 1) return 'right';
  return null;
}

export interface MazeState {
  level: number;
  rows: number;
  cols: number;
  grid: Grid;
  player: Pos;
  goal: Pos;
  stars: Set<string>;
  trail: Set<string>;
  collected: number;
  total: number;
  won: boolean;
}

export interface StepResult {
  /** The single cell the mouse moved into, or null if it didn't move. */
  cell: Pos | null;
  collected: boolean;
  reachedGoal: boolean;
}

/** Place stars evenly along the solution path (excluding start and goal). */
function placeStars(grid: Grid, start: Pos, goal: Pos): Set<string> {
  const inner = solvePath(grid, start, goal).slice(1, -1);
  const stars = new Set<string>();
  const count = Math.min(STAR_COUNT, inner.length);
  for (let i = 1; i <= count; i++) {
    stars.add(keyOf(inner[Math.floor((inner.length * i) / (count + 1))]));
  }
  return stars;
}

function buildLevel(level: number): MazeState {
  const size = sizeForLevel(level);
  const grid = generateMaze(size, size);
  const player: Pos = { row: 0, col: 0 };
  const goal: Pos = { row: size - 1, col: size - 1 };
  const stars = placeStars(grid, player, goal);
  return {
    level,
    rows: size,
    cols: size,
    grid,
    player,
    goal,
    stars,
    trail: new Set([keyOf(player)]),
    collected: 0,
    total: stars.size,
    won: false,
  };
}

export function useMaze() {
  const [state, setState] = useState<MazeState>(() => buildLevel(1));
  // Authoritative copy, mutated synchronously so rapid drag events that fire
  // before a re-render still read the up-to-date position (avoids dropped steps).
  const live = useRef(state);

  const commit = useCallback((next: MazeState) => {
    live.current = next;
    setState(next);
  }, []);

  /**
   * Move the mouse into `target` ONLY when it is a directly adjacent, open cell
   * (the cell the finger is currently over while dragging). No path-finding: a
   * tap on a far/off-path cell does nothing, and the mouse can never outrun the
   * finger. To go back, the child simply drags back over the previous cell.
   */
  const tryStep = useCallback(
    (target: Pos): StepResult => {
      const s = live.current;
      const miss: StepResult = { cell: null, collected: false, reachedGoal: false };
      if (s.won) return miss;

      const dir = adjacentDir(s.player, target);
      if (!dir || !canMove(s.grid, s.player, dir)) return miss;

      const k = keyOf(target);
      const trail = new Set(s.trail).add(k);
      const stars = new Set(s.stars);
      const collected = stars.delete(k);
      const reachedGoal = target.row === s.goal.row && target.col === s.goal.col;

      commit({
        ...s,
        player: target,
        trail,
        stars,
        collected: collected ? s.collected + 1 : s.collected,
        won: reachedGoal,
      });

      return { cell: target, collected, reachedGoal };
    },
    [commit],
  );

  const nextLevel = useCallback(() => {
    commit(buildLevel(live.current.level + 1));
  }, [commit]);

  const hintPath = useCallback(
    (): Pos[] => solvePath(live.current.grid, live.current.player, live.current.goal),
    [],
  );

  return { state, tryStep, nextLevel, hintPath };
}
