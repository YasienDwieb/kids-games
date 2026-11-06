/* Candy Catch — standalone game host.
 *
 * The playfield (motion, spawning, catching) lives in <CatchField>; this screen
 * owns progression, the HUD, hearts and the start and lose overlays. Each level
 * or retry remounts the field with a fresh key, which resets it. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  levelsFromGenerator,
  ResumePrompt,
  tierFactor,
  useAdaptive,
  useLevels,
  useRoundEnd,
  useSound,
} from '@/sdk';
import { CatchField } from './components/CatchField';
import { Hud } from './components/Hud';
import { StartOverlay, LoseOverlay } from './components/Overlays';
import { buildLevel } from './constants';

const MAX_LIVES = 3;
const RETRY_PAUSE_MS = 1500;

export default function CandyCatchGame() {
  const { play } = useSound();
  const source = useMemo(() => levelsFromGenerator(buildLevel), []);
  const { status, level, data, start, startOver, advance } = useLevels({
    gameId: 'candy-catch',
    source,
  });

  // 'won' holds the field still while the celebration plays.
  const [overlay, setOverlay] = useState<'start' | 'won' | 'lose' | 'none'>('start');
  const roundEnd = useRoundEnd();
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(retryTimer.current), []);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  // Bumped on retry so the field remounts fresh on the same level.
  const [attempt, setAttempt] = useState(0);

  // Adaptive difficulty: losing twice slows things down, a winning streak
  // speeds them up — on top of the level curve.
  const { tier, record } = useAdaptive('candy-catch');
  const tuned = useMemo(
    () => ({
      ...data,
      fallSpeed: data.fallSpeed * tierFactor(tier, 0.12),
      spawnInterval: data.spawnInterval / tierFactor(tier, 0.1),
      hazardChance: data.hazardChance * tierFactor(tier, 0.25),
    }),
    [data, tier],
  );

  useEffect(() => {
    setScore(0);
    setLives(MAX_LIVES);
  }, [level, attempt]);

  const handleStart = useCallback(() => {
    play('transition');
    setOverlay('none');
  }, [play]);

  const handleNext = useCallback(() => {
    play('transition');
    setOverlay('none');
    advance(0);
  }, [play, advance]);

  const handleRetry = useCallback(() => {
    play('transition');
    setOverlay('none');
    setAttempt((a) => a + 1);
  }, [play]);

  const handleWin = useCallback(() => {
    play('win');
    record(true);
    setOverlay('won');
    void roundEnd.next('big', handleNext);
  }, [play, record, roundEnd, handleNext]);

  const handleLose = useCallback(() => {
    record(false);
    setOverlay('lose');
    retryTimer.current = setTimeout(handleRetry, RETRY_PAUSE_MS);
  }, [record, handleRetry]);

  if (status === 'loading') return <View style={styles.root} />;
  if (status === 'resumable') {
    return (
      <View style={styles.root}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.dots}>
        {DOTS.map((d, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: d.s / 2 },
            ]}
          />
        ))}
      </View>

      <CatchField
        key={`${level}-${attempt}`}
        data={tuned}
        active={status === 'playing' && overlay === 'none'}
        maxLives={MAX_LIVES}
        onScore={setScore}
        onLives={setLives}
        onWin={handleWin}
        onLose={handleLose}
      />

      <Hud score={score} target={data.target} lives={lives} />

      {overlay === 'start' && <StartOverlay onStart={handleStart} />}
      {overlay === 'lose' && <LoseOverlay />}
    </View>
  );
}

// Static soft background dots
const DOTS = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 37) % 100) * 4,
  y: ((i * 53) % 100) * 6,
  s: 6 + ((i * 7) % 8),
}));

const styles = StyleSheet.create({
  root: { flex: 1 },
  dots: { ...StyleSheet.absoluteFill },
  dot: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.6)' },
});
