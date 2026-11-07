/**
 * Match Up — standalone game screen (bare, landscape).
 *
 * Connect each top item to its matching bottom item by dragging a line. Endless:
 * difficulty ramps then caps (see utils/levels), so every solve moves on to a
 * fresh round by itself.
 *
 * Bare layout: GamePlayerScreen floats the back button (top-start); this screen
 * owns its safe-area padding.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  MascotHelper,
  ResumePrompt,
  SPACING,
  useLevels,
  useRoundEnd,
  useTranslation,
} from '@/sdk';
import { MatchBoard } from './components/MatchBoard';
import { makeMatchUpLevels } from './utils/levels';

const ACCENT = 'purple' as const;

export default function MatchUpGame(): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Per-session seed — the only Math.random call site (kept out of the pure layer).
  const initialSeed = useMemo(() => Math.floor(Math.random() * 0x7fffffff), []);
  const [sessionSeed, setSessionSeed] = useState(initialSeed);
  const source = useMemo(() => makeMatchUpLevels(sessionSeed), [sessionSeed]);

  const { status, data, level, start, startOver, advance } = useLevels({
    gameId: 'match-up',
    source,
  });

  const roundEnd = useRoundEnd();
  const [solved, setSolved] = useState(false);
  // Wrong links this round — Lulu encourages, then points after repeated misses.
  const [misses, setMisses] = useState(0);

  // Reset the per-round gates whenever the level changes.
  useEffect(() => {
    setSolved(false);
    setMisses(0);
  }, [level]);

  const startNewGame = useCallback(() => {
    setSessionSeed(Math.floor(Math.random() * 0x7fffffff));
    startOver();
  }, [startOver]);

  const handleSolved = useCallback(() => {
    setSolved(true);
    void roundEnd.next('big', advance);
  }, [roundEnd, advance]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t('match-up:loading')}</Text>
      </View>
    );
  }

  if (status === 'resumable') {
    return (
      <View style={styles.root}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startNewGame} />
      </View>
    );
  }

  const pad = {
    paddingTop: insets.top + SPACING.xs,
    paddingBottom: insets.bottom + SPACING.xs,
    paddingStart: insets.left + SPACING.md,
    paddingEnd: insets.right + SPACING.md,
  };

  return (
    <View style={[styles.root, pad]}>
      <MatchBoard
        key={level}
        round={data}
        accent={ACCENT}
        onWrong={() => setMisses((m) => m + 1)}
        onSolved={handleSolved}
      />

      <MascotHelper pose={solved || misses === 0 ? null : misses === 1 ? 'encourage' : 'point'} />

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.canvas,
  },
  loadingText: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.inkSoft,
  },
});
