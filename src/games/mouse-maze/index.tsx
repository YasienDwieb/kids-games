import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  DemoHand,
  EmojiImage,
  ResumePrompt,
  levelsFromGenerator,
  useCelebrate,
  useFirstRun,
  useIdle,
  useLevels,
  useSound,
  type DemoPoint,
} from '@/sdk';
import { Hud } from './components/Hud';
import { MazeBoard } from './components/MazeBoard';
import { WinOverlay } from './components/WinOverlay';
import { EMOJI, HINT_MS, MAZE_COLORS, STEP_MS } from './constants';
import { useMaze, buildLevel } from './hooks/useMaze';
import type { Pos } from './types';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// The demo hand traces this many cells of the route ahead of the mouse.
const DEMO_CELLS = 3;
// Show the hand again after this long without a successful step.
const IDLE_HINT_MS = 9000;

export default function MouseMazeGame() {
  const { play } = useSound();
  const source = useMemo(() => levelsFromGenerator(buildLevel), []);
  const { status, data, level, start, startOver, advance } = useLevels({
    gameId: 'mouse-maze',
    source,
  });
  const { state, tryStep, hintPath } = useMaze(data);

  const { width: winW, height: winH } = useWindowDimensions();
  const landscape = winW > winH;

  const [area, setArea] = useState({ width: 0, height: 0 });
  const [showWin, setShowWin] = useState(false);
  const [hintCells, setHintCells] = useState<Set<string>>(new Set());
  const celebrate = useCelebrate();

  // First play: a ghost hand drags the mouse along the route. Afterwards it
  // only comes back when the child has been stuck for a while.
  const firstRun = useFirstRun('mouse-maze');
  const { idle, poke } = useIdle(IDLE_HINT_MS, status === 'playing' && !state.won);

  // Fresh value per level so the mouse always starts at the top-left start cell.
  const pan = useMemo(() => new Animated.ValueXY({ x: 0, y: 0 }), [state.level]);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cellSize = useMemo(() => {
    if (!area.width || !area.height) return 0;
    // Cap by the smaller dimension so the board stays square; in landscape the
    // measured area is already just the maze column (not the full screen width).
    const usable = Math.min(area.width, area.height) * 0.9;
    return Math.floor(usable / state.cols);
  }, [area, state.cols]);

  const cellToXY = useCallback((p: Pos) => ({ x: p.col * cellSize, y: p.row * cellSize }), [cellSize]);

  // Re-snap the mouse to the player cell when the board is (re)sized, e.g. on
  // first layout or rotation. Level resets are handled by the fresh `pan` above.
  useEffect(() => {
    if (cellSize > 0) pan.setValue(cellToXY(state.player));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize]);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  // Follow the finger: step the mouse into the cell under the finger, but only
  // when that cell is directly adjacent and open (handled in the hook). The mouse
  // is therefore finger-paced — it moves as fast as you drag, never faster — and
  // ignores taps on far/off-path cells. Held in a ref so the (stable) PanResponder
  // always calls the latest closure.
  const bump = useRef(new Animated.Value(0)).current;
  const lastBump = useRef<string | null>(null);
  const dragRef = useRef<(localX: number, localY: number) => void>(() => {});
  dragRef.current = (localX, localY) => {
    if (cellSize <= 0 || state.won) return;
    const target: Pos = {
      row: clamp(Math.floor(localY / cellSize), 0, state.rows - 1),
      col: clamp(Math.floor(localX / cellSize), 0, state.cols - 1),
    };
    const res = tryStep(target);
    if (res.blocked) {
      // Pushing into a wall answers with a bump — once per wall, not on every
      // move event while the finger rests there — so it never feels broken.
      const k = `${state.player.row},${state.player.col}>${target.row},${target.col}`;
      if (lastBump.current !== k) {
        lastBump.current = k;
        play('hit');
        bump.setValue(0);
        Animated.sequence([
          Animated.timing(bump, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(bump, { toValue: -1, duration: 60, useNativeDriver: true }),
          Animated.timing(bump, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      }
      return;
    }
    if (!res.cell) return;
    lastBump.current = null;
    poke();
    if (firstRun.status === 'show') firstRun.complete();

    play(res.collected ? 'success' : 'pop');

    Animated.timing(pan, {
      toValue: cellToXY(res.cell),
      duration: STEP_MS,
      useNativeDriver: true,
    }).start();

    if (res.reachedGoal) {
      play('win');
      void celebrate('big', { praise: false });
      setShowWin(true);
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) =>
          dragRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderMove: (e: GestureResponderEvent) =>
          dragRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY),
      }),
    [],
  );

  const handleHint = useCallback(() => {
    if (state.won) return;
    play('powerup');
    const cells = new Set(hintPath().map((p) => `${p.row},${p.col}`));
    setHintCells(cells);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintCells(new Set()), HINT_MS);
  }, [hintPath, play, state.won]);

  const handleNext = useCallback(() => {
    play('transition');
    setHintCells(new Set());
    setShowWin(false);
    advance(state.collected);
  }, [advance, play, state.collected]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
  }, []);

  const boardSize = cellSize * state.cols;

  const showDemo = !state.won && (firstRun.status === 'show' || idle);
  const demoPoints = useMemo<DemoPoint[]>(() => {
    if (!showDemo || cellSize <= 0) return [];
    // From the mouse's own cell, along the next few cells of the solution.
    return hintPath()
      .slice(0, DEMO_CELLS + 1)
      .map((p) => ({ x: (p.col + 0.5) * cellSize, y: (p.row + 0.5) * cellSize }));
    // state.player: re-plan from wherever the mouse is now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDemo, cellSize, hintPath, state.player]);

  if (status === 'loading') return <View style={styles.root} />;
  if (status === 'resumable') {
    return (
      <View style={styles.root}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />
      </View>
    );
  }

  const mazeBoard = cellSize > 0 ? (
    <>
      {/* direction:'ltr' pins the play area so grid columns, the mouse
          position (absolute + translateX), and locationX touch coords all
          share physical-left origin — spatial puzzles must not mirror. */}
      <View
        style={[{ width: boardSize, height: boardSize }, styles.ltrBoard]}
        {...responder.panHandlers}
      >
        {/* pointerEvents none so the board View stays the touch target and
            locationX/Y are relative to the board origin. */}
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
          <EmojiImage emoji={EMOJI.mouse} size={cellSize * 0.66} />
        </Animated.View>
        {demoPoints.length > 1 ? (
          <DemoHand mode="drag" points={demoPoints} size={Math.max(44, cellSize * 0.9)} />
        ) : null}
      </View>
    </>
  ) : null;

  if (landscape) {
    // Landscape: row layout — square maze on the left, HUD panel on the right.
    // onLayout measures the maze column so cellSize is derived from its height
    // (the shorter dimension), keeping the board square.
    return (
      <View style={styles.rootRow}>
        <View style={styles.mazeColumn} onLayout={onLayout}>
          <View style={styles.center} pointerEvents="box-none">
            {mazeBoard}
          </View>
        </View>
        <View style={styles.sidePanel} pointerEvents="box-none">
          <Hud
            level={state.level}
            collected={state.collected}
            total={state.total}
            onHint={handleHint}
            landscape
          />
        </View>
        {showWin && (
          <WinOverlay collected={state.collected} total={state.total} onNext={handleNext} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      {cellSize > 0 && (
        <View style={styles.center} pointerEvents="box-none">
          {mazeBoard}
        </View>
      )}

      <Hud
        level={state.level}
        collected={state.collected}
        total={state.total}
        onHint={handleHint}
      />

      {showWin && (
        <WinOverlay collected={state.collected} total={state.total} onNext={handleNext} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: MAZE_COLORS.background },
  // Landscape root: row — maze column + side panel.
  rootRow: { flex: 1, flexDirection: 'row', backgroundColor: MAZE_COLORS.background },
  // Maze occupies a square region; flex:1 lets it take remaining horizontal space
  // after the side panel. onLayout gives the real h so cellSize is height-capped.
  mazeColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Side panel: fixed enough to hold the HUD controls; grows no wider than needed.
  sidePanel: { justifyContent: 'center', alignItems: 'center' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  mouse: { position: 'absolute', top: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  // Always applied (a no-op in LTR): gating it on I18nManager.isRTL broke when
  // the native layout direction and isRTL disagree, as in Expo Go. Keeps the
  // maze, mouse, and touch coordinates in the same physical-left frame.
  ltrBoard: { direction: 'ltr' as const },
});
