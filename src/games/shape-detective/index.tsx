/**
 * Shape Detective — main game screen (Sprint 4).
 *
 * All three puzzle types are playable:
 *   pattern     → PatternPuzzle (tap the correct next shape)
 *   oddOneOut   → OddOneOutPuzzle (tap the shape that doesn't belong)
 *   sort        → SortPuzzle (drag shapes into their matching bins)
 *
 * Flow:
 *   loading   → blank screen
 *   resumable → ResumePrompt (continue / start over)
 *   playing   → current puzzle + score HUD via GameShell
 *
 * Win/celebration:
 *   Last level solved → 'win' sound (sfx.win intent) + LevelSolvedOverlay.
 *   All other levels  → 'success' sound + same overlay.
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
import { OddOneOutPuzzle } from './components/OddOneOutPuzzle';
import { PatternPuzzle } from './components/PatternPuzzle';
import { SortPuzzle } from './components/SortPuzzle';
import { shapeDetectiveLevels } from './utils/levels';

// ---------------------------------------------------------------------------
// Level-solved overlay content — rendered via GameShell 'win' slot.
// Uses EmojiFrame + Star primitives for kid-friendly reward display.
// ---------------------------------------------------------------------------

type LevelSolvedOverlayProps = {
  isLast: boolean;
  onNext: () => void;
  t: ReturnType<typeof useTranslation>['t'];
};

function LevelSolvedOverlay({ isLast, onNext, t }: LevelSolvedOverlayProps): React.JSX.Element {
  return (
    <View style={overlayStyles.root}>
      <View style={[overlayStyles.card, SHADOWS.lg]}>
        {/* Tinted emoji frame as the reward icon */}
        <EmojiFrame
          emoji={isLast ? '🏆' : '⭐️'}
          size={72}
          tint={ACCENTS.purple.tint}
        />
        {/* Star row — 3 stars as a kid-friendly reward cue */}
        <View style={overlayStyles.starsRow}>
          <Star size={28} filled />
          <Star size={36} filled />
          <Star size={28} filled />
        </View>
        <Text style={overlayStyles.title}>
          {t('shape-detective:levelSolved.title')}
        </Text>
        <PressableButton
          label={
            isLast
              ? t('shape-detective:levelSolved.finish')
              : t('shape-detective:levelSolved.next')
          }
          onPress={onNext}
          accent="purple"
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

export default function ShapeDetectiveGame(): React.JSX.Element {
  const { play } = useSound();
  const shell = useGameShell();
  const { t } = useTranslation();

  const { status, data, level, score, isLast, start, startOver, advance, addScore } = useLevels({
    gameId: 'shape-detective',
    source: shapeDetectiveLevels,
  });

  // Track which option the player has selected (null = unanswered this round)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Flag set when this level has been solved; prevents double-advance
  // and lets handleNext read the live isLast via the ref below.
  const [solved, setSolved] = useState(false);

  // Shake animation for wrong answer
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Scale pop for correct answer — gentle bounce to 1.06 then back
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Keep timer ids in a ref so useEffect can clear them properly.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the shell score display in sync
  useEffect(() => {
    shell.setScore(score);
  }, [score, shell]);

  // Hide any win overlay when we advance to a new level; reset solved flag.
  useEffect(() => {
    shell.hideOverlay('win');
    setSelectedIndex(null);
    setSolved(false);
  }, [level, shell]);

  // Clear pending timers on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  // handleNext reads isLast at call time (live closure), not from a
  // stale closure captured at pick time.
  const handleNext = useCallback(() => {
    shell.hideOverlay('win');
    if (isLast) {
      startOver();
    } else {
      advance();
    }
  }, [advance, isLast, shell, startOver]);

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

  // Gentle scale pop on correct answer — bounces the puzzle view up then back.
  const triggerCorrectPop = useCallback(() => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim]);

  // Shared "correct answer" handler — used by Pattern and OddOneOut tap handlers.
  // Awards score, plays the appropriate sound (win on last level, success otherwise),
  // marks the level solved, and shows the overlay after a brief delay.
  const handleCorrect = useCallback(() => {
    void play(isLast ? 'win' : 'success');
    addScore(10);
    setSolved(true);
    triggerCorrectPop();
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      shell.showOverlay(
        'win',
        <LevelSolvedOverlay isLast={isLast} onNext={handleNext} t={t} />,
      );
    }, 600);
  }, [play, isLast, addScore, shell, handleNext, t, triggerCorrectPop]);

  // handlePick: used by PatternPuzzle and OddOneOutPuzzle (tap-to-answer).
  const handlePick = useCallback(
    (idx: number) => {
      // Guard on solved (level already answered) as well as selectedIndex.
      if (selectedIndex !== null || solved) return;

      setSelectedIndex(idx);

      const puzzle = data.puzzle;
      // Only pattern and oddOneOut use this handler; sort uses handleSortSolved.
      if (puzzle.type !== 'pattern' && puzzle.type !== 'oddOneOut') return;

      if (idx === puzzle.correctIndex) {
        handleCorrect();
      } else {
        void play('wrong');
        triggerShake();
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSelectedIndex(null), 900);
      }
    },
    [selectedIndex, solved, data.puzzle, handleCorrect, play, triggerShake],
  );

  // handleSortSolved: called by SortPuzzle when every item is correctly placed.
  const handleSortSolved = useCallback(() => {
    if (solved) return;
    handleCorrect();
  }, [solved, handleCorrect]);

  // handleSortDrop: called on every drop (correct or not) so we can play sounds.
  // SortPuzzle handles its own visual feedback; we only play sounds here.
  const handleSortDrop = useCallback(
    (itemIndex: number, binIndex: number) => {
      const puzzle = data.puzzle;
      if (puzzle.type !== 'sort') return;
      if (binIndex === -1) {
        void play('wrong');
        return;
      }
      if (binIndex === puzzle.assignments[itemIndex]) {
        void play('success');
      } else {
        void play('wrong');
      }
    },
    [data.puzzle, play],
  );

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t('shape-detective:loading')}</Text>
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
  // Puzzle dispatcher — renders all three types.
  // scaleAnim wraps tap-answer puzzles for the correct-answer pop effect.
  // SortPuzzle manages its own internal visual feedback.
  // ---------------------------------------------------------------------------

  const puzzle = data.puzzle;

  if (puzzle.type === 'oddOneOut') {
    return (
      <Animated.View
        style={[
          styles.root,
          { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
        ]}
      >
        <OddOneOutPuzzle
          puzzle={puzzle}
          selectedIndex={selectedIndex}
          onPick={handlePick}
          disabled={selectedIndex !== null}
        />
      </Animated.View>
    );
  }

  if (puzzle.type === 'sort') {
    // SortPuzzle manages its own placement state; the host just wires
    // sound + win overlay via handleSortDrop and handleSortSolved.
    return (
      <View style={styles.root}>
        <SortPuzzle
          puzzle={puzzle}
          onDrop={handleSortDrop}
          onSolved={handleSortSolved}
        />
      </View>
    );
  }

  // Default: pattern
  return (
    <Animated.View
      style={[
        styles.root,
        { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
      ]}
    >
      <PatternPuzzle
        puzzle={puzzle}
        selectedIndex={selectedIndex}
        onPick={handlePick}
        disabled={selectedIndex !== null}
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
