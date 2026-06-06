import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSound, useLevels, levelsFromGenerator, ResumePrompt } from '@/sdk';
import { Archer } from './components/Archer';
import { Balloon } from './components/Balloon';
import { Arrow } from './components/Arrow';
import { LaneGuide } from './components/LaneGuide';
import { Hud } from './components/Hud';
import { LevelOverlay } from './components/LevelOverlay';
import { useArcheryGame } from './hooks/useArcheryGame';
import { buildLevel, TOTAL_LEVELS } from './utils/levels';
import { GROUND_COLOR, GROUND_H } from './constants';

export default function BalloonArcherGame() {
  const { play } = useSound();
  const source = useMemo(() => levelsFromGenerator(buildLevel, { count: TOTAL_LEVELS }), []);
  const { status, data, level, isLast, start, startOver, advance } = useLevels({
    gameId: 'balloon-archer',
    source,
  });

  const [area, setArea] = useState({ width: 0, height: 0 });
  const [overlay, setOverlay] = useState<{ variant: 'cleared' | 'failed'; stars: number } | null>(
    null,
  );

  // This game plays in landscape; restore portrait on the way out.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const onShoot = useCallback(() => play('whoosh'), [play]);
  const onPop = useCallback(() => play('explosion'), [play]);
  const onCleared = useCallback(
    (stars: number) => {
      play('win');
      setOverlay({ variant: 'cleared', stars });
    },
    [play],
  );
  const onFailed = useCallback(() => {
    play('wrong');
    setOverlay({ variant: 'failed', stars: 0 });
  }, [play]);

  const game = useArcheryGame({
    area,
    data,
    enabled: status === 'playing' && overlay === null,
    onShoot,
    onPop,
    onCleared,
    onFailed,
  });

  const handleNext = useCallback(() => {
    play('next');
    const stars = overlay?.stars ?? 0;
    setOverlay(null);
    if (isLast) startOver();
    else advance(stars);
  }, [advance, isLast, overlay, play, startOver]);

  const handleRetry = useCallback(() => {
    play('next');
    setOverlay(null);
    game.retry();
  }, [game, play]);

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
    <View style={styles.root} onLayout={onLayout} {...game.panHandlers}>
      <View style={[styles.ground, { height: GROUND_H, backgroundColor: GROUND_COLOR }]} />

      {area.width > 0 && (
        <>
          {w.drawing && <LaneGuide x={game.archerX} y={w.laneY} width={area.width} />}
          {w.balloons.map((b) => (
            <Balloon key={b.id} x={b.x} y={b.y} r={b.r} color={b.color} popping={b.popping} />
          ))}
          {w.arrow && <Arrow x={w.arrow.x} y={w.arrow.y} angle={0} />}
          <Archer x={game.archerX} y={w.laneY} drawing={w.drawing} />
        </>
      )}

      <Hud level={level} popped={w.popped} quota={data.quota} arrowsLeft={w.arrowsLeft} />

      {overlay && (
        <LevelOverlay
          variant={overlay.variant}
          stars={overlay.stars}
          isLast={isLast}
          popped={w.popped}
          quota={data.quota}
          onNext={handleNext}
          onRetry={handleRetry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
