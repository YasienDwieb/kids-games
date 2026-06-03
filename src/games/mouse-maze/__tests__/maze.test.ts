import { canMove, generateMaze, openExits, slide, solvePath } from '../utils/maze';
import type { Direction, Grid, Pos } from '../types';

/** Flood-fill the open passages and count reachable cells from (0,0). */
function reachableCount(grid: Grid): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Set<string>(['0,0']);
  const stack: Pos[] = [{ row: 0, col: 0 }];
  while (stack.length) {
    const cur = stack.pop() as Pos;
    for (const d of openExits(grid, cur)) {
      const dr = { up: -1, down: 1, left: 0, right: 0 }[d];
      const dc = { up: 0, down: 0, left: -1, right: 1 }[d];
      const n = { row: cur.row + dr, col: cur.col + dc };
      const k = `${n.row},${n.col}`;
      if (!seen.has(k)) {
        seen.add(k);
        stack.push(n);
      }
    }
  }
  return seen.size;
}

describe('generateMaze', () => {
  it('produces a grid of the requested size', () => {
    const grid = generateMaze(6, 6);
    expect(grid).toHaveLength(6);
    expect(grid.every((row) => row.length === 6)).toBe(true);
  });

  it('is a perfect maze — every cell is reachable from the start', () => {
    for (const size of [5, 7, 9]) {
      const grid = generateMaze(size, size);
      expect(reachableCount(grid)).toBe(size * size);
    }
  });

  it('keeps walls consistent between adjacent cells', () => {
    const grid = generateMaze(5, 5);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        expect(grid[r][c].right).toBe(grid[r][c + 1].left);
      }
    }
  });
});

describe('solvePath', () => {
  it('returns a contiguous, wall-respecting path between two cells', () => {
    const grid = generateMaze(7, 7);
    const from: Pos = { row: 0, col: 0 };
    const to: Pos = { row: 6, col: 6 };
    const path = solvePath(grid, from, to);

    expect(path[0]).toEqual(from);
    expect(path[path.length - 1]).toEqual(to);

    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      const stepDir = (Object.entries({
        up: a.row - b.row === 1 && a.col === b.col,
        down: b.row - a.row === 1 && a.col === b.col,
        left: a.col - b.col === 1 && a.row === b.row,
        right: b.col - a.col === 1 && a.row === b.row,
      }).find(([, ok]) => ok)?.[0] ?? null) as Direction | null;
      expect(stepDir).not.toBeNull();
      expect(canMove(grid, a, stepDir as Direction)).toBe(true);
    }
  });
});

describe('slide', () => {
  it('stops at a wall and never moves through one', () => {
    const grid = generateMaze(6, 6);
    const start: Pos = { row: 0, col: 0 };
    for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
      const path = slide(grid, start, dir);
      if (!canMove(grid, start, dir)) {
        expect(path).toHaveLength(0);
      } else {
        expect(path.length).toBeGreaterThan(0);
      }
    }
  });
});
