/* The board is split into two layers on purpose.
 *
 * Dragging the mouse commits a new maze state on every step, and the clay walls
 * are the expensive part of the tree, so they are memoized on the level
 * (`grid`/`cellSize` never change within one) and render exactly once, while
 * the handful of markers that actually change live in their own cheap
 * absolutely-positioned layer. */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { EmojiImage, pulse, useLoop } from '@/sdk';
import { CLAY_DEPTH, EMOJI, FLOOR_RADIUS, MAZE_COLORS, pieceSize, wallThickness } from '../constants';
import type { Grid, Pos } from '../types';

const keyOf = (r: number, c: number): string => `${r},${c}`;

/** Parse a "row,col" marker key back into pixel offsets. */
const posOf = (key: string, cellSize: number) => {
  const [r, c] = key.split(',');
  return { top: Number(r) * cellSize, left: Number(c) * cellSize };
};

type Run = { horizontal: boolean; line: number; from: number; to: number };

/**
 * Merge each inner grid line's wall edges into continuous runs (fewer, cleaner
 * walls). The outer border is skipped: the clay tray rim is the maze's edge.
 */
function wallRuns(grid: Grid): Run[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const runs: Run[] = [];
  const collect = (horizontal: boolean, line: number, count: number, has: (i: number) => boolean) => {
    let start = -1;
    for (let i = 0; i <= count; i++) {
      const on = i < count && has(i);
      if (on && start < 0) start = i;
      if (!on && start >= 0) {
        runs.push({ horizontal, line, from: start, to: i - 1 });
        start = -1;
      }
    }
  };
  for (let r = 1; r < rows; r++) {
    collect(true, r, cols, (c) => grid[r][c].top);
  }
  for (let c = 1; c < cols; c++) {
    collect(false, c, rows, (r) => grid[r][c].left);
  }
  return runs;
}

/** A clay piece: a darker underside, the body, and a soft top highlight. */
function ClayDisc({ size, color, depth }: { size: number; color: string; depth: string }) {
  return (
    <>
      <View
        style={[
          styles.abs,
          { width: size, height: size, borderRadius: size / 2, top: CLAY_DEPTH / 2, backgroundColor: depth },
        ]}
      />
      <View
        style={[styles.abs, { width: size, height: size, borderRadius: size / 2, top: 0, backgroundColor: color }]}
      />
      <View
        style={[
          styles.abs,
          styles.shine,
          { width: size * 0.5, height: size * 0.18, borderRadius: size, top: size * 0.12, left: size * 0.18 },
        ]}
      />
    </>
  );
}

/** Static layer: clay walls. Re-renders only when the level changes. */
const MazeWalls = memo(function MazeWalls({ grid, cellSize }: { grid: Grid; cellSize: number }) {
  const runs = useMemo(() => wallRuns(grid), [grid]);
  const t = wallThickness(cellSize);

  // Every wall's underside first, then every body, then the highlights, so
  // crossing walls fuse into one clay shape with no seams at the joints.
  const pass = (tag: string, color: string, dx: number, dy: number, shrink = 0, inset = 0) =>
    runs.map((run, i) => {
      const thick = t - shrink * 2;
      const len = (run.to - run.from + 1) * cellSize + t - inset * 2;
      const along = run.from * cellSize - t / 2 + inset;
      const across = run.line * cellSize - t / 2 + shrink;
      return (
        <View
          key={`${tag}${i}`}
          style={[
            styles.abs,
            { backgroundColor: color, borderRadius: thick / 2 },
            run.horizontal
              ? { left: along + dx, top: across + dy, width: len, height: thick }
              : { left: across + dx, top: along + dy, width: thick, height: len },
            tag === 'h' && styles.shine,
          ]}
        />
      );
    });

  const hl = Math.max(2, Math.round(t * 0.3));
  return (
    <View style={StyleSheet.absoluteFill}>
      {pass('d', MAZE_COLORS.wallDepth, 0, CLAY_DEPTH)}
      {pass('b', MAZE_COLORS.wall, 0, 0)}
      {pass('h', MAZE_COLORS.shine, -t * 0.12, -t * 0.12, (t - hl) / 2, t * 0.6)}
    </View>
  );
});

/** Dynamic layer: breadcrumbs, hint path, stars, the cheese on its clay pad. */
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
  // One of the two animated elements on the board (the other is the mouse).
  const glow = useLoop(1400);
  const pad = pieceSize(cellSize);
  const emojiSize = pad * 0.72;
  const goalKey = keyOf(goal.row, goal.col);

  // A collected star springs up and fades where it was, so the pickup reads.
  const prevStars = useRef(stars);
  const [popped, setPopped] = useState<{ key: string; v: Animated.Value }[]>([]);
  useEffect(() => {
    const gone = [...prevStars.current].filter((k) => !stars.has(k));
    prevStars.current = stars;
    if (gone.length === 0) return;
    const fresh = gone.map((key) => ({ key, v: new Animated.Value(0) }));
    setPopped((p) => [...p, ...fresh]);
    fresh.forEach(({ key, v }) =>
      Animated.timing(v, { toValue: 1, duration: 380, useNativeDriver: true }).start(() =>
        setPopped((p) => p.filter((x) => x.key !== key)),
      ),
    );
  }, [stars]);
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
      {[...trail].filter((k) => !hintCells.has(k) && k !== goalKey).map((k) => dot(k, styles.trail, 0.2))}
      {[...hintCells].filter((k) => k !== goalKey).map((k) => dot(k, styles.hint, 0.32))}
      {[...stars].map((k) => {
        const { top, left } = posOf(k, cellSize);
        return (
          <View key={k} style={[styles.marker, { top, left, width: cellSize, height: cellSize }]}>
            <EmojiImage emoji={EMOJI.star} size={emojiSize} />
          </View>
        );
      })}
      {popped.map(({ key, v }) => {
        const { top, left } = posOf(key, cellSize);
        return (
          <Animated.View
            key={`pop${key}`}
            style={[
              styles.marker,
              {
                top,
                left,
                width: cellSize,
                height: cellSize,
                opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [
                  { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -cellSize * 0.5] }) },
                  { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) },
                ],
              },
            ]}
          >
            <EmojiImage emoji={EMOJI.star} size={emojiSize} />
          </Animated.View>
        );
      })}
      <View
        style={[
          styles.marker,
          { top: goal.row * cellSize, left: goal.col * cellSize, width: cellSize, height: cellSize },
        ]}
      >
        <Animated.View style={[{ width: pad, height: pad + CLAY_DEPTH / 2 }, pulse(glow, 0.08)]}>
          <ClayDisc size={pad} color={MAZE_COLORS.goalPad} depth={MAZE_COLORS.goalDepth} />
          <View style={[styles.abs, styles.center, { width: pad, height: pad }]}>
            <EmojiImage emoji={EMOJI.goal} size={emojiSize} />
          </View>
        </Animated.View>
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

/** Maze layer: clay walls (static) plus breadcrumbs, hint path, stars and goal. */
export function MazeBoard({ grid, cellSize, goal, stars, trail, hintCells }: MazeBoardProps) {
  return (
    <View style={{ width: cellSize * (grid[0]?.length ?? 0), height: cellSize * grid.length }}>
      {/* Clip walls to the floor so ends meeting the edge sit flush with the rim. */}
      <View style={styles.clip}>
        <MazeWalls grid={grid} cellSize={cellSize} />
      </View>
      <MazeMarkers cellSize={cellSize} goal={goal} stars={stars} trail={trail} hintCells={hintCells} />
    </View>
  );
}

export { ClayDisc };

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  clip: { ...StyleSheet.absoluteFill, overflow: 'hidden', borderRadius: FLOOR_RADIUS },
  center: { top: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  shine: { backgroundColor: MAZE_COLORS.shine, opacity: 0.45 },
  marker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  trail: { position: 'absolute', borderRadius: 999, opacity: 0.35, backgroundColor: MAZE_COLORS.trail },
  hint: { position: 'absolute', borderRadius: 999, backgroundColor: MAZE_COLORS.hint },
});
