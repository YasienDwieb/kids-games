/**
 * Count & Pop — main game screen (Sprint 2).
 *
 * Modes playable:
 *   countThisMany → CountThisMany (pop exactly N tiles)
 *   howMany       → HowMany (count shown objects, pick numeral)
 *   makeN         → HowMany (choice-row variant with makeN prompt)
 *   addition      → HowMany (choice-row variant with addition prompt)
 *
 * Flow:
 *   loading   → blank screen
 *   resumable → ResumePrompt (continue / start over)
 *   playing   → current round + score HUD via GameShell
 *
 * Win/celebration:
 *   Last level → 'win' sound + LevelSolvedOverlay.
 *   Others     → 'success' sound + same overlay.
 *
 * Traps avoided:
 *   - Stale-isLast: handleNext is a live closure reading isLast at call time.
 *   - Double-advance: `solved` flag guards all callbacks.
 *   - Timer leak: timerRef cleaned up in useEffect return.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  EmojiFrame,
  FONT_SIZES,
  FONTS,
  PressableButton,
  ResumePrompt,
  SHADOWS,
  SPACING,
  Star,
  useGameShell,
  useLevels,
  useSound,
  useTranslation,
} from '@/sdk';
import { CountThisMany } from './components/CountThisMany';
import { HowMany } from './components/HowMany';
import { countAndPopLevels } from './utils/levels';

// ---------------------------------------------------------------------------
// Level-solved overlay — rendered via GameShell 'win' slot.
// ---------------------------------------------------------------------------

type LevelSolvedOverlayProps = {
  isLast: boolean;
  onNext: () => void;
  t: ReturnType<typeof useTranslation>['t'];
};

function LevelSolvedOverlay({
  isLast,
  onNext,
  t,
}: LevelSolvedOverlayProps): React.JSX.Element {
  return (
    <View style={overlayStyles.root}>
      <View style={[overlayStyles.card, SHADOWS.lg]}>
        {/* Trophy on last level, star otherwise */}
        <EmojiFrame
          emoji={isLast ? '🏆' : '⭐️'}
          size={72}
          tint={ACCENTS.pink.tint}
        />
        {/* 3-star reward row */}
        <View style={overlayStyles.starsRow}>
          <Star size={28} filled />
          <Star size={36} filled />
          <Star size={28} filled />
        </View>
        <Text style={overlayStyles.title}>
          {t('count-and-pop:levelSolved.title')}
        </Text>
        <PressableButton
          label={
            isLast
              ? t('count-and-pop:levelSolved.finish')
              : t('count-and-pop:levelSolved.next')
          }
          onPress={onNext}
          accent="pink"
        />
      </View>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.tile,
    backgroundColor: COLORS.surface,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CountAndPopGame(): React.JSX.Element {
  const { play } = useSound();
  const shell = useGameShell();
  const { t } = useTranslation();

  const {
    status,
    data,
    level,
    score,
    isLast,
    start,
    startOver,
    advance,
    addScore,
  } = useLevels({
    gameId: 'count-and-pop',
    source: countAndPopLevels,
  });

  // Which choice index the player tapped (null = unanswered this round).
  // Also used as a guard: if not null, ignore further taps.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Prevents double-advance after the level is already won.
  const [solved, setSolved] = useState(false);

  // Shake animation for wrong answers
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Pending setTimeout ids — cleared on unmount.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Keep the GameShell HUD score display in sync.
  useEffect(() => {
    shell.setScore(score);
  }, [score, shell]);

  // When the level advances, dismiss the win overlay and reset selection/solved.
  useEffect(() => {
    shell.hideOverlay('win');
    setSelectedIndex(null);
    setSolved(false);
  }, [level, shell]);

  // Clear any pending timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  // Live closure — reads isLast at call time, not at pick time.
  // This prevents the stale-isLast trap when the overlay fires after a delay.
  const handleNext = useCallback(() => {
    shell.hideOverlay('win');
    if (isLast) {
      startOver();
    } else {
      advance();
    }
  }, [advance, isLast, shell, startOver]);

  // Shake animation for wrong answer feedback.
  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Shared correct-answer handler — used by both mode types.
  const handleCorrect = useCallback(() => {
    void play(isLast ? 'win' : 'success');
    addScore(10);
    setSolved(true);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      shell.showOverlay(
        'win',
        <LevelSolvedOverlay isLast={isLast} onNext={handleNext} t={t} />,
      );
    }, 600);
  }, [play, isLast, addScore, shell, handleNext, t]);

  // handlePick: used by HowMany (choice-row modes).
  // Guards on `selectedIndex !== null || solved` to prevent double-advance.
  const handlePick = useCallback(
    (idx: number) => {
      if (selectedIndex !== null || solved) return;

      setSelectedIndex(idx);

      const { round } = data;
      // countThisMany doesn't use this handler
      if (round.mode === 'countThisMany') return;

      if (idx === round.correctIndex) {
        handleCorrect();
      } else {
        void play('wrong');
        triggerShake();
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSelectedIndex(null), 900);
      }
    },
    [selectedIndex, solved, data, handleCorrect, play, triggerShake],
  );

  // handlePop: called by CountThisMany on each individual tile pop.
  const handlePop = useCallback(
    (_count: number) => {
      void play('pop');
    },
    [play],
  );

  // handleCountSolved: called by CountThisMany when target pops reached.
  const handleCountSolved = useCallback(() => {
    if (solved) return;
    handleCorrect();
  }, [solved, handleCorrect]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t('count-and-pop:loading')}</Text>
      </View>
    );
  }

  if (status === 'resumable') {
    return (
      <View style={styles.root}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Round dispatcher
  // ---------------------------------------------------------------------------

  const { round } = data;

  if (round.mode === 'countThisMany') {
    return (
      <Animated.View
        style={[
          styles.root,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <CountThisMany
          round={round}
          onPop={handlePop}
          onSolved={handleCountSolved}
          disabled={solved}
        />
      </Animated.View>
    );
  }

  // howMany / makeN / addition — all use the choice-row HowMany component.
  return (
    <Animated.View
      style={[
        styles.root,
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      <HowMany
        round={round}
        selectedIndex={selectedIndex}
        onPick={handlePick}
        disabled={solved}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
