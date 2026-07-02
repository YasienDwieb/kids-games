/**
 * Match Up — standalone game screen (bare, landscape).
 *
 * Connect each top item to its matching bottom item by dragging a line. Free
 * play keeps a running score (POINTS_PER_MATCH per correct link, persisted via
 * useLevels). Endless: difficulty ramps then caps (see utils/levels), so every
 * solve advances to a fresh round.
 *
 * Bare layout: GamePlayerScreen floats the back button (top-start); this screen
 * owns its safe-area padding, the score HUD (top-end), and the solved overlay.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  FONT_SIZES,
  HudPill,
  hudTextStyle,
  PressableButton,
  ResumePrompt,
  SHADOWS,
  SPACING,
  Star,
  useLevels,
  useTranslation,
} from '@/sdk';
import { MatchBoard } from './components/MatchBoard';
import { makeMatchUpLevels } from './utils/levels';
import { POINTS_PER_MATCH } from './constants';

const ACCENT = 'purple' as const;

export default function MatchUpGame(): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Per-session seed — the only Math.random call site (kept out of the pure layer).
  const initialSeed = useMemo(() => Math.floor(Math.random() * 0x7fffffff), []);
  const [sessionSeed, setSessionSeed] = useState(initialSeed);
  const source = useMemo(() => makeMatchUpLevels(sessionSeed), [sessionSeed]);

  const { status, data, level, score, start, startOver, advance, addScore } = useLevels({
    gameId: 'match-up',
    source,
  });

  const [solved, setSolved] = useState(false);

  // Reset the per-round solved gate whenever the level changes.
  useEffect(() => setSolved(false), [level]);

  const startNewGame = useCallback(() => {
    setSessionSeed(Math.floor(Math.random() * 0x7fffffff));
    startOver();
  }, [startOver]);

  const handleSolved = useCallback(() => setSolved(true), []);
  const handleNext = useCallback(() => {
    setSolved(false);
    advance();
  }, [advance]);

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
      <View style={styles.hud} pointerEvents="none">
        <HudPill>
          <Star size={18} filled />
          <Text style={hudTextStyle}>{t('match-up:score', { n: score })}</Text>
        </HudPill>
      </View>

      <MatchBoard
        key={level}
        round={data}
        accent={ACCENT}
        onCorrect={() => addScore(POINTS_PER_MATCH)}
        onSolved={handleSolved}
      />

      {solved ? (
        <View style={styles.overlay}>
          <View style={[styles.card, SHADOWS.lg]}>
            <View style={styles.starsRow}>
              <Star size={26} filled />
              <Star size={34} filled />
              <Star size={26} filled />
            </View>
            <Text style={styles.cardTitle}>{t('match-up:solved.title')}</Text>
            <PressableButton
              label={t('match-up:solved.next')}
              onPress={handleNext}
              accent={ACCENT}
            />
          </View>
        </View>
      ) : null}
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
  hud: {
    position: 'absolute',
    top: SPACING.sm,
    end: SPACING.md,
    zIndex: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: SPACING.lg,
  },
  card: {
    maxWidth: 360,
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.tile,
    backgroundColor: COLORS.surface,
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  cardTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
