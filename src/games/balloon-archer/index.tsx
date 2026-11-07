import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  currentLanguage,
  DemoHand,
  useSound,
  useLevels,
  levelsFromGenerator,
  ResumePrompt,
  tierFactor,
  useAdaptive,
  useGuide,
  useRoundEnd,
} from '@/sdk';
import { Archer } from './components/Archer';
import { Balloon } from './components/Balloon';
import { Arrow } from './components/Arrow';
import { LaneGuide } from './components/LaneGuide';
import { Hud } from './components/Hud';
import { OutOfArrows } from './components/OutOfArrows';
import { useArcheryGame } from './hooks/useArcheryGame';
import { buildLevel, TOTAL_LEVELS } from './utils/levels';
import { popPhrase } from './phrase';

// three + react-three-fiber + expo-gl are only evaluated once a level is on screen.
const Playfield3D = lazy(() => import('./components/Playfield3D').then((m) => ({ default: m.Playfield3D })));

const MEADOW = require('./assets/meadow.jpg');
/** The pause after running out of arrows, before the level starts again. */
const RETRY_PAUSE_MS = 1500;

export default function BalloonArcherGame() {
  const { play } = useSound();
  const source = useMemo(() => levelsFromGenerator(buildLevel, { count: TOTAL_LEVELS }), []);
  const { status, data, level, isLast, start, startOver, advance, finish } = useLevels({
    gameId: 'balloon-archer',
    source,
  });

  // Adaptive difficulty: struggling earns spare arrows and calmer balloons; a
  // winning streak makes them rise a little faster. Applied from the next try.
  const { tier, record } = useAdaptive('balloon-archer');
  const tuned = useMemo(
    () => ({
      ...data,
      arrows: data.arrows + Math.max(0, -tier) * 2,
      riseSpeed: data.riseSpeed * tierFactor(tier, 0.1),
    }),
    [data, tier],
  );

  const [area, setArea] = useState({ width: 0, height: 0 });
  // 'cleared' holds the field still while the celebration plays.
  const [overlay, setOverlay] = useState<'cleared' | 'failed' | null>(null);
  const roundEnd = useRoundEnd();
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(retryTimer.current), []);

  const onPop = useCallback(() => play('balloon'), [play]);
  // Read through refs: the game loop keeps the first callbacks it was given.
  const levelEnd = useRef({ isLast, advance, finish });
  levelEnd.current = { isLast, advance, finish };
  const onCleared = useCallback(
    (stars: number) => {
      play('win');
      record(true);
      setOverlay('cleared');
      const { isLast: last, advance: next, finish: end } = levelEnd.current;
      if (last) void roundEnd.end(end);
      else
        void roundEnd.next('big', () => {
          setOverlay(null);
          next(stars);
        });
    },
    [play, record, roundEnd],
  );

  const onFailed = useCallback(() => {
    play('wrong');
    record(false);
    setOverlay('failed');
  }, [play, record]);

  const game = useArcheryGame({
    area,
    data: tuned,
    enabled: status === 'playing' && overlay === null,
    onPop,
    onCleared,
    onFailed,
  });

  const retryRef = useRef(game.retry);
  retryRef.current = game.retry;
  const onFailedNow = useCallback(() => {
    retryTimer.current = setTimeout(() => {
      play('next');
      setOverlay(null);
      retryRef.current();
    }, RETRY_PAUSE_MS);
  }, [play]);
  useEffect(() => {
    if (overlay === 'failed') onFailedNow();
  }, [overlay, onFailedNow]);

  // Press anywhere to draw the bow, slide to pick the height, let go to shoot.
  const guide = useGuide({
    id: 'balloon-archer',
    phrase: popPhrase(currentLanguage()),
    roundKey: level,
    active: status === 'playing' && overlay === null,
  });
  const demoPoints = useMemo(
    () =>
      area.height > 0
        ? [
            { x: game.archerX + 70, y: area.height * 0.62 },
            { x: game.archerX + 70, y: area.height * 0.34 },
          ]
        : [],
    [area.height, game.archerX],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
  }, []);

  if (status === 'loading') return <View style={styles.root} onLayout={onLayout} />;
  if (status === 'resumable') {
    return (
      <View style={styles.root} onLayout={onLayout}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />
      </View>
    );
  }

  const w = game.world;

  return (
    <View style={styles.root} onLayout={onLayout} onTouchStart={guide.poke} {...game.panHandlers}>
      <Image source={MEADOW} style={styles.backdrop} resizeMode="cover" />

      {area.width > 0 && (
        <>
          {w.drawing && <LaneGuide x={game.archerX} y={w.laneY} width={area.width} />}
          {/* The 3D scene, with the flat 2D sprites standing in while it loads. */}
          <Suspense
            fallback={
              <>
                {w.balloons.map((b) => (
                  <Balloon key={b.id} x={b.x} y={b.y} r={b.r} color={b.color} popping={b.popping} />
                ))}
                {w.arrow && <Arrow x={w.arrow.x} y={w.arrow.y} angle={0} />}
                <Archer x={game.archerX} y={w.laneY} drawing={w.drawing} />
              </>
            }
          >
            <Playfield3D world={w} width={area.width} height={area.height} archerX={game.archerX} />
          </Suspense>
        </>
      )}

      <Hud popped={w.popped} quota={data.quota} arrowsLeft={w.arrowsLeft} />

      {guide.showDemo && demoPoints.length > 1 ? <DemoHand mode="drag" points={demoPoints} /> : null}

      {overlay === 'failed' && <OutOfArrows />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  backdrop: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
});
