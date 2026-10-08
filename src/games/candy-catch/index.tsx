/* Candy Catch — standalone game host.
 *
 * The playfield (motion, spawning, catching) lives in <CatchField>; this screen
 * owns progression, the HUD, hearts and the start/win/lose overlays. Each level
 * or retry remounts the field with a fresh key, which resets it. */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { levelsFromGenerator, ResumePrompt, useLevels, useSound } from '@/sdk';
import { CatchField } from './components/CatchField';
import { Hud } from './components/Hud';
import { StartOverlay, WinOverlay, LoseOverlay } from './components/Overlays';
import { buildLevel } from './constants';

const MAX_LIVES = 3;

export default function CandyCatchGame() {
  const { play } = useSound();
  const source = useMemo(() => levelsFromGenerator(buildLevel), []);
  const { status, level, data, start, startOver, advance } = useLevels({
    gameId: 'candy-catch',
    source,
  });

  const [overlay, setOverlay] = useState<'start' | 'win' | 'lose' | 'none'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  // Bumped on retry so the field remounts fresh on the same level.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setScore(0);
    setLives(MAX_LIVES);
  }, [level, attempt]);

  const handleWin = useCallback(() => {
    play('win');
    setOverlay('win');
  }, [play]);

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
        data={data}
        active={status === 'playing' && overlay === 'none'}
        maxLives={MAX_LIVES}
        onScore={setScore}
        onLives={setLives}
        onWin={handleWin}
        onLose={() => setOverlay('lose')}
      />

      <Hud level={level} score={score} target={data.target} lives={lives} />

      {overlay === 'start' && <StartOverlay onStart={handleStart} />}
      {overlay === 'win' && <WinOverlay score={score} onNext={handleNext} />}
      {overlay === 'lose' && <LoseOverlay onRetry={handleRetry} />}
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
