# Mouse Maze — Design Spec

**Date:** 2026-06-02
**Branch:** `feat/mouse-maze`
**Status:** Approved

## Concept

A mouse 🐭 needs help getting home to its cheese 🧀. The child drags the mouse to
guide it through a maze that grows harder each level. Self-contained game module
under `src/games/mouse-maze/`, registered via `src/games/index.ts`, using **bare
layout** (full-canvas, like `color-mixer`). Imports only from `@/sdk`.

- **Age range:** 3–8
- **Layout:** `{ mode: 'bare' }`

## Controls — drag to lead

The child presses anywhere on the board and drags a finger; the mouse follows
toward the finger, stepping cell-by-cell through open corridors and stopping at
walls. No directions to learn — you simply "lead the mouse." (Swipe-to-slide was
the original design but tested too abstract for young children.)

Implementation: on each drag event the cell under the finger is computed and the
mouse greedily takes valid (no-wall) orthogonal steps toward it, up to a small
per-event cap, animating each step.

## Maze generation — procedural, grows with progress

- Perfect maze via **randomized DFS / recursive backtracker** — exactly one
  solution between any two cells, always solvable.
- Grid starts **5×5** and grows **+1 per level** up to a **9×9** cap; beyond the
  cap, levels stay 9×9 with fresh random layouts.
- Cell size auto-computed from available screen space.

## Features

- **⭐ Collectible stars** — a few stars placed on solution/branch cells; grabbing
  one plays `success` and increments the star counter.
- **🎉 Win overlay** — on reaching home: emoji burst, `win` sound, and a
  **"Next maze →"** button (plays `transition`, advances level).
- **Breadcrumb trail** — faint dots mark visited cells so kids don't get lost.
- **💡 Hint button** — briefly flashes the solution path (BFS from current cell
  to goal).

## Audio (all via `useSound`)

| Event | Intent |
|-------|--------|
| Mouse advances (per drag batch) | `pop` |
| Star collected | `success` |
| Reached home | `win` |
| Next maze | `transition` |

## Visuals

Warm palette, rounded walls, soft background. Top HUD: "Maze · Level N" + ⭐ count
+ 💡 hint button. Mouse 🐭 and goal 🧀 rendered as large emoji tiles.

## File layout

```
mouse-maze/
  config.ts            registerGame (bare mode, ageRange 3–8)
  index.tsx            root component, drag handling, orchestration
  types.ts
  constants.ts         sizes, colors, level rules
  utils/maze.ts        generateMaze (DFS) + solvePath (BFS)   <- pure, unit-tested
  hooks/useMaze.ts     grid/player/level/stars state + moveTo (drag) logic
  components/
    MazeBoard.tsx
    Hud.tsx
    WinOverlay.tsx
```

## Data model

- A `Cell` holds wall flags for its four sides (`top`, `right`, `bottom`,
  `left`). Grid is `Cell[][]` indexed `[row][col]`.
- `MazeState`: `grid`, `cols`, `rows`, `player {row,col}`, `goal {row,col}`,
  `stars: Set<"r,c">`, `trail: Set<"r,c">`, `collected`, `total`, `level`, `won`.

## Drag logic (`tryStep`)

Each drag event maps the finger position to a target cell. The mouse moves into
that cell **only when it is directly adjacent and open** (`tryStep` in the hook) —
i.e. the cell the finger is tracing along the corridor. There is no path-finding:
a tap on a far or off-path cell does nothing, and the mouse can never outrun the
finger (it is finger-paced; speed = drag speed). To go back, the child drags back
over the previous cell. The hook keeps an authoritative `live` ref mutated
synchronously so rapid events firing before a re-render don't drop steps. Stars on
the entered cell are collected; reaching the goal wins the level. `STEP_MS` only
smooths the hop between adjacent cells. `utils/maze.ts` still exposes `slide`
(used by tests) but the game no longer uses it.

## Testing

Unit tests for the pure `utils/maze.ts`:
- generated maze is fully connected (every cell reachable from start);
- `solvePath(grid, a, b)` returns a contiguous, wall-respecting path;
- grid dimensions match requested size.

`npx tsc --noEmit` and `npm test` must pass.
