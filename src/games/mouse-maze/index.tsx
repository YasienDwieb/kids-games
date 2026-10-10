import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  MascotHelper,
  ResumePrompt,
  levelsFromGenerator,
  useCelebrate,
  useFirstRun,
  useIdle,
  useLevels,
  useSound,
} from '@/sdk';
import { Hud } from './components/Hud';
import { MazeView } from './components/MazeView';
import { WinOverlay } from './components/WinOverlay';
import { FRAME_PAD, HINT_MS, MAZE_COLORS } from './constants';
import { useMaze, buildLevel, type StepResult } from './hooks/useMaze';

// Show the hand again after this long without a successful step.
const IDLE_HINT_MS = 9000;

export default function MouseMazeGame() {
  const { play } = useSound();
  const source = useMemo(() => levelsFromGenerator(buildLevel), []);
  const { status, data, level, start, startOver, advance } = useLevels({
    gameId: 'mouse-maze',
    source,
  });
  const maze = useMaze(data);
  const { state, hintPath } = maze;

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

  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cellSize = useMemo(() => {
    if (!area.width || !area.height) return 0;
    // Cap by the smaller dimension so the board stays square; in landscape the
    // measured area is already just the maze column (not the full screen width).
    const usable = Math.min(area.width, area.height) * 0.92 - FRAME_PAD * 2 - 8;
    return Math.floor(usable / state.cols);
  }, [area, state.cols]);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  const handleStep = useCallback(
    (res: StepResult) => {
      poke();
      if (firstRun.status === 'show') firstRun.complete();
      if (res.reachedGoal) {
        play('win');
        void celebrate('big', { praise: false });
        setShowWin(true);
      }
    },
    [poke, firstRun, play, celebrate],
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

  const showDemo = !state.won && (firstRun.status === 'show' || idle);

  if (status === 'loading') return <View style={styles.root} />;
  if (status === 'resumable') {
    return (
      <View style={styles.root}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />
      </View>
    );
  }

  const mazeBoard = (
    <MazeView maze={maze} cellSize={cellSize} hintCells={hintCells} showDemo={showDemo} onStep={handleStep} />
  );

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
        {/* Lulu points at the maze while the demo hand shows the way. */}
        <MascotHelper
          pose={showDemo ? 'point' : null}
          side="end"
          size={100}
          pointTo={I18nManager.isRTL ? 'right' : 'left'}
          // Her bubble would cover the hint button in this corner.
          say={false}
        />
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
});
