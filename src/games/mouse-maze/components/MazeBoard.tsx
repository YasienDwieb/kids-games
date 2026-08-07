/* The board is split into two layers on purpose.
 *
 * Dragging the mouse commits a new maze state on every step, and the wall grid
 * is the expensive part of the tree — up to 9x9 cells, each a bordered View.
 * Re-rendering all of it per drag step was the source of the stutter, so the
 * walls are memoized on the level (`grid`/`cellSize` never change within one)
 * and render exactly once, while the handful of markers that actually change
 * live in their own cheap absolutely-positioned layer. */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmojiImage } from '@/sdk';
import { EMOJI, MAZE_COLORS, WALL_WIDTH } from '../constants';
import type { Grid, Pos } from '../types';

const keyOf = (r: number, c: number): string => `${r},${c}`;

/** Parse a "row,col" marker key back into pixel offsets. */
const posOf = (key: string, cellSize: number) => {
  const [r, c] = key.split(',');
  return { top: Number(r) * cellSize, left: Number(c) * cellSize };
};

/** Static layer: the wall grid. Re-renders only when the level changes. */
const MazeWalls = memo(function MazeWalls({
  grid,
  cellSize,
}: {
  grid: Grid;
  cellSize: number;
}) {
  return (
    <View>
      {grid.map((rowCells, r) => (
        <View key={r} style={styles.row}>
          {rowCells.map((cell, c) => (
            <View
              key={c}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderTopWidth: cell.top ? WALL_WIDTH : 0,
                  borderRightWidth: cell.right ? WALL_WIDTH : 0,
                  borderBottomWidth: cell.bottom ? WALL_WIDTH : 0,
                  borderLeftWidth: cell.left ? WALL_WIDTH : 0,
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
});

/** Dynamic layer: breadcrumbs, hint path, stars, goal — a few small views. */
const MazeMarkers = memo(function MazeMarkers({
  cellSize,
  goal,
  stars,
  trail,
  hintCells,
}: {
  cellSize: number;
  goal: Pos;
  stars: Set<string>;
  trail: Set<string>;
  hintCells: Set<string>;
}) {
  const emojiSize = cellSize * 0.6;
  const goalKey = keyOf(goal.row, goal.col);
  const dot = (key: string, style: object, ratio: number) => {
    const { top, left } = posOf(key, cellSize);
    const size = cellSize * ratio;
    return (
      <View
        key={key}
        style={[
          style,
          { top: top + (cellSize - size) / 2, left: left + (cellSize - size) / 2, width: size, height: size },
        ]}
      />
    );
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[...trail]
        .filter((k) => !hintCells.has(k) && k !== goalKey)
        .map((k) => dot(k, styles.trail, 0.28))}
      {[...hintCells].filter((k) => k !== goalKey).map((k) => dot(k, styles.hint, 0.4))}
      {[...stars].map((k) => {
        const { top, left } = posOf(k, cellSize);
        return (
          <View key={k} style={[styles.marker, { top, left, width: cellSize, height: cellSize }]}>
            <EmojiImage emoji={EMOJI.star} size={emojiSize} />
          </View>
        );
      })}
      <View
        style={[
          styles.marker,
          { top: goal.row * cellSize, left: goal.col * cellSize, width: cellSize, height: cellSize },
        ]}
      >
        <EmojiImage emoji={EMOJI.goal} size={emojiSize} />
      </View>
    </View>
  );
});

interface MazeBoardProps {
  grid: Grid;
  cellSize: number;
  goal: Pos;
  stars: Set<string>;
  trail: Set<string>;
  hintCells: Set<string>;
}

/** Maze layer: walls (static) plus breadcrumbs, hint path, stars and goal. */
export function MazeBoard({ grid, cellSize, goal, stars, trail, hintCells }: MazeBoardProps) {
  return (
    <View>
      <MazeWalls grid={grid} cellSize={cellSize} />
      <MazeMarkers
        cellSize={cellSize}
        goal={goal}
        stars={stars}
        trail={trail}
        hintCells={hintCells}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: MAZE_COLORS.wall,
  },
  marker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  trail: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: MAZE_COLORS.trail,
  },
  hint: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: MAZE_COLORS.hint,
  },
});
