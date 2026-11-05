/**
 * The playable maze: walls + trail + stars, the mouse, finger-tracing input, the
 * wall bump, and the optional demo hand. Shared by the standalone game and the
 * guided-flow unit; each host owns its own layout, HUD and win handling.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DemoHand, EmojiImage, type DemoPoint } from '@/sdk';
import { ClayDisc, MazeBoard } from './MazeBoard';
import { CLAY_DEPTH, EMOJI, FLOOR_RADIUS, FRAME_PAD, MAZE_COLORS, STEP_MS, pieceSize } from '../constants';
import { useMazeDrive } from '../hooks/useMazeDrive';
import type { StepResult, useMaze } from '../hooks/useMaze';
import type { Pos } from '../types';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// The demo hand traces this many cells of the route ahead of the mouse.
const DEMO_CELLS = 3;

type MazeViewProps = {
  maze: ReturnType<typeof useMaze>;
  cellSize: number;
  hintCells?: Set<string>;
  /** Show the ghost hand tracing the next few cells. */
  showDemo?: boolean;
  /** Called after every successful step (including the one reaching the cheese). */
  onStep?: (res: StepResult) => void;
};

const NO_HINTS = new Set<string>();

export function MazeView({ maze, cellSize, hintCells = NO_HINTS, showDemo = false, onStep }: MazeViewProps) {
  const { state, hintPath } = maze;

  // Fresh value per level so the mouse always starts at the top-left start cell.
  const pan = useMemo(() => new Animated.ValueXY({ x: 0, y: 0 }), [state.level]);
  const cellToXY = (p: Pos) => ({ x: p.col * cellSize, y: p.row * cellSize });

  // Re-snap the mouse to the player cell when the board is (re)sized, e.g. on
  // first layout or rotation. Level resets are handled by the fresh `pan` above.
  useEffect(() => {
    if (cellSize > 0)
      pan.setValue({
        x: state.player.col * cellSize,
        y: state.player.row * cellSize,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize, pan]);

  // Follow the finger: step the mouse into the cell under the finger, but only
  // when that cell is directly adjacent and open (handled in the hooks). The
  // mouse is therefore finger-paced — it moves as fast as you drag, never
  // faster — and ignores taps on far/off-path cells.
  const bump = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const drive = useMazeDrive(maze, {
    onStep,
    onBump: () => {
      bump.setValue(0);
      Animated.sequence([
        Animated.timing(bump, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(bump, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(bump, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    },
    onMove: (cell) => {
      Animated.timing(pan, { toValue: cellToXY(cell), duration: STEP_MS, useNativeDriver: true }).start();
      hop.setValue(1);
      Animated.spring(hop, { toValue: 0, friction: 4, tension: 160, useNativeDriver: true }).start();
    },
  });
  const dragRef = useRef<(localX: number, localY: number) => void>(() => {});
  dragRef.current = (localX, localY) => {
    if (cellSize <= 0) return;
    drive.current({
      row: clamp(Math.floor(localY / cellSize), 0, state.rows - 1),
      col: clamp(Math.floor(localX / cellSize), 0, state.cols - 1),
    });
  };

  // Native gesture recognition (RNGH); callbacks on JS since there's no reanimated.
  const drag = useRef(
    Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .onBegin((e) => dragRef.current(e.x, e.y))
      .onUpdate((e) => dragRef.current(e.x, e.y)),
  ).current;

  const demoPoints = useMemo<DemoPoint[]>(() => {
    if (!showDemo || state.won || cellSize <= 0) return [];
    // From the mouse's own cell, along the next few cells of the solution.
    return hintPath()
      .slice(0, DEMO_CELLS + 1)
      .map((p) => ({
        x: (p.col + 0.5) * cellSize,
        y: (p.row + 0.5) * cellSize,
      }));
    // state.player: re-plan from wherever the mouse is now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDemo, state.won, cellSize, hintPath, state.player]);

  if (cellSize <= 0) return null;
  const boardSize = cellSize * state.cols;
  const token = pieceSize(cellSize);

  return (
    // direction:'ltr' pins the play area so grid columns, the mouse position
    // (absolute + translateX), and locationX touch coords all share a
    // physical-left origin — spatial puzzles must not mirror. Always applied:
    // gating it on I18nManager.isRTL broke when native direction and isRTL
    // disagree (Expo Go).
    <View style={styles.tray}>
      <View style={[StyleSheet.absoluteFill, styles.trayDepth]} />
      <View style={styles.trayBody}>
        <GestureDetector gesture={drag}>
          <View style={[{ width: boardSize, height: boardSize }, styles.floor, styles.ltrBoard]}>
            {/* A soft inner shade along the top edge sets the floor down into the tray. */}
            <View pointerEvents="none" style={styles.floorShade} />
            <View pointerEvents="none">
              <MazeBoard
                grid={state.grid}
                cellSize={cellSize}
                goal={state.goal}
                stars={state.stars}
                trail={state.trail}
                hintCells={hintCells}
              />
            </View>
            <Animated.View
              key={state.level}
              pointerEvents="none"
              style={[
                styles.mouse,
                {
                  width: cellSize,
                  height: cellSize,
                  transform: [
                    ...pan.getTranslateTransform(),
                    { translateX: bump.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] }) },
                    { rotate: bump.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] }) },
                  ],
                },
              ]}
            >
              <Animated.View
                style={{
                  width: token,
                  height: token + CLAY_DEPTH / 2,
                  // Clay squish on every step, springing back.
                  transform: [{ scale: hop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) }],
                }}
              >
                <ClayDisc size={token} color={MAZE_COLORS.token} depth={MAZE_COLORS.tokenDepth} />
                <View style={[styles.mouseFace, { width: token, height: token }]}>
                  <EmojiImage emoji={EMOJI.mouse} size={token * 0.74} />
                </View>
              </Animated.View>
            </Animated.View>
            {demoPoints.length > 1 ? (
              <DemoHand mode="drag" points={demoPoints} size={Math.max(44, cellSize * 0.9)} />
            ) : null}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mouse: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ltrBoard: { direction: 'ltr' as const },
  tray: { paddingBottom: CLAY_DEPTH * 1.5 },
  trayDepth: { top: CLAY_DEPTH * 1.5, borderRadius: FLOOR_RADIUS + FRAME_PAD, backgroundColor: MAZE_COLORS.trayDepth },
  trayBody: { padding: FRAME_PAD, borderRadius: FLOOR_RADIUS + FRAME_PAD, backgroundColor: MAZE_COLORS.tray },
  floor: { backgroundColor: MAZE_COLORS.floor, borderRadius: FLOOR_RADIUS },
  floorShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CLAY_DEPTH * 2,
    borderTopLeftRadius: FLOOR_RADIUS,
    borderTopRightRadius: FLOOR_RADIUS,
    backgroundColor: MAZE_COLORS.floorShade,
  },
  mouseFace: { position: 'absolute', top: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
