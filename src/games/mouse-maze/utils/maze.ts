import type { Cell, Direction, Grid, Pos } from '../types';

type Side = keyof Cell;

const DIRS: Direction[] = ['up', 'down', 'left', 'right'];
const DR: Record<Direction, number> = { up: -1, down: 1, left: 0, right: 0 };
const DC: Record<Direction, number> = { up: 0, down: 0, left: -1, right: 1 };
/** The wall a movement direction passes through. */
const SIDE: Record<Direction, Side> = { up: 'top', down: 'bottom', left: 'left', right: 'right' };
const OPP_SIDE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function makeCell(): Cell {
  return { top: true, right: true, bottom: true, left: true };
}

function inBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

export function createGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => makeCell()),
  );
}

function carve(grid: Grid, row: number, col: number, dir: Direction): void {
  const side = SIDE[dir];
  grid[row][col][side] = false;
  grid[row + DR[dir]][col + DC[dir]][OPP_SIDE[side]] = false;
}

/**
 * Generate a perfect maze (exactly one path between any two cells) using an
 * iterative randomized depth-first search / recursive backtracker.
 * `rand` is injectable so tests can run deterministically.
 */
export function generateMaze(rows: number, cols: number, rand: () => number = Math.random): Grid {
  const grid = createGrid(rows, cols);
  const visited = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const stack: Pos[] = [{ row: 0, col: 0 }];
  visited[0][0] = true;

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const options = DIRS.filter((d) => {
      const nr = cur.row + DR[d];
      const nc = cur.col + DC[d];
      return inBounds(nr, nc, rows, cols) && !visited[nr][nc];
    });

    if (options.length === 0) {
      stack.pop();
      continue;
    }

    const dir = options[Math.floor(rand() * options.length)];
    carve(grid, cur.row, cur.col, dir);
    const next = { row: cur.row + DR[dir], col: cur.col + DC[dir] };
    visited[next.row][next.col] = true;
    stack.push(next);
  }

  return grid;
}

/** Can the mouse step from `pos` in `dir` (no wall and in bounds)? */
export function canMove(grid: Grid, pos: Pos, dir: Direction): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const nr = pos.row + DR[dir];
  const nc = pos.col + DC[dir];
  if (!inBounds(nr, nc, rows, cols)) return false;
  return !grid[pos.row][pos.col][SIDE[dir]];
}

/** Directions with no wall from `pos`. */
export function openExits(grid: Grid, pos: Pos): Direction[] {
  return DIRS.filter((d) => canMove(grid, pos, d));
}

/**
 * Slide from `from` in `dir` until hitting a wall or reaching a junction
 * (a cell with more than two open exits). Stops early if `stopAt` is reached.
 * Returns the cells passed through (excluding the start).
 */
export function slide(grid: Grid, from: Pos, dir: Direction, stopAt?: Pos): Pos[] {
  const path: Pos[] = [];
  let cur = from;
  while (canMove(grid, cur, dir)) {
    cur = { row: cur.row + DR[dir], col: cur.col + DC[dir] };
    path.push(cur);
    if (stopAt && cur.row === stopAt.row && cur.col === stopAt.col) break;
    if (openExits(grid, cur).length > 2) break;
  }
  return path;
}

const keyOf = (p: Pos): string => `${p.row},${p.col}`;

/** Shortest path from `from` to `to` via BFS, inclusive of both endpoints. */
export function solvePath(grid: Grid, from: Pos, to: Pos): Pos[] {
  const prev = new Map<string, Pos | null>();
  const queue: Pos[] = [from];
  prev.set(keyOf(from), null);

  while (queue.length > 0) {
    const cur = queue.shift() as Pos;
    if (cur.row === to.row && cur.col === to.col) break;
    for (const d of openExits(grid, cur)) {
      const n = { row: cur.row + DR[d], col: cur.col + DC[d] };
      if (prev.has(keyOf(n))) continue;
      prev.set(keyOf(n), cur);
      queue.push(n);
    }
  }

  if (!prev.has(keyOf(to))) return [];
  const path: Pos[] = [];
  let node: Pos | null | undefined = to;
  while (node) {
    path.unshift(node);
    node = prev.get(keyOf(node)) ?? null;
  }
  return path;
}
