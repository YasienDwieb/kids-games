import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  I18nManager,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSound, useLevels, levelsFromGenerator, ResumePrompt, EmojiImage } from '@/sdk';
import { Hud } from './components/Hud';
import { MazeBoard } from './components/MazeBoard';
import { WinOverlay } from './components/WinOverlay';
import { EMOJI, HINT_MS, MAZE_COLORS, STEP_MS } from './constants';
import { useMaze, buildLevel } from './hooks/useMaze';
import type { Pos } from './types';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

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
  const dragRef = useRef<(localX: number, localY: number) => void>(() => {});
  dragRef.current = (localX, localY) => {
    if (cellSize <= 0 || state.won) return;
    const target: Pos = {
      row: clamp(Math.floor(localY / cellSize), 0, state.rows - 1),
      col: clamp(Math.floor(localX / cellSize), 0, state.cols - 1),
    };
    const res = tryStep(target);
    if (!res.cell) return;

    play('pop');
    if (res.collected) play('success');

    Animated.timing(pan, {
      toValue: cellToXY(res.cell),
      duration: STEP_MS,
      useNativeDriver: true,
    }).start();

    if (res.reachedGoal) {
      play('win');
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
        style={[{ width: boardSize, height: boardSize }, I18nManager.isRTL && styles.ltrBoard]}
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
            { width: cellSize, height: cellSize, transform: pan.getTranslateTransform() },
          ]}
        >
          <EmojiImage emoji={EMOJI.mouse} size={cellSize * 0.66} />
        </Animated.View>
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
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  mouse: { position: 'absolute', top: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  // Applied to the play area when RTL is active so the maze, mouse, and touch
  // coordinates all stay in the same physical-left frame.
  ltrBoard: { direction: 'ltr' as const },
});
