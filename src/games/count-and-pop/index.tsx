/**
 * Count & Pop — main game screen (Sprint 3).
 *
 * Modes playable:
 *   countThisMany → CountThisMany (pop exactly N tiles)
 *   howMany       → HowMany (count shown objects, pick numeral)
 *   makeN         → HowMany + GroupCount (two-group visual: have + empty slots)
 *   addition      → HowMany + GroupCount (two-group visual: a + b)
 *
 * Flow:
 *   loading   → blank screen
 *   resumable → ResumePrompt (continue / start over)
 *   playing   → current round + score HUD via GameShell
 *
 * Win/celebration (endless — there is no last level):
 *   Every solve → 'success' sound + a short SDK celebration, then auto-advance.
 *   Every MILESTONE_EVERY-th level → big confetti + LevelSolvedOverlay (⭐️ + "Next").
 *
 * Mistakes follow the SDK hint policy (useHintLadder): 1st miss = try again,
 * 2nd = the right numeral pulses, 3rd = it's revealed. First-try solves score more.
 *
 * Juice (Sprint 3.4 — RN Animated only, no Reanimated):
 *   - Wrong answer: board shake (triggerShake) reused from Sprint 2.
 *   - Correct answer (choice modes): solve-pop spring on the round view
 *     (scale 1→1.04→1) before the overlay appears after 600ms.
 *   - Correct answer (countThisMany): same solve-pop spring on onSolved.
 *   - LevelSolvedOverlay: trophy + stars already present (Sprint 2).
 *
 * Traps avoided:
 *   - Stale-isLast: handleNext is a live closure reading isLast at call time.
 *   - Double-advance: `solved` flag guards all callbacks.
 *   - Timer leak: timerRef cleaned up in useEffect return.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  EmojiFrame,
  FONT_SIZES,
  FONTS,
  MascotHelper,
  PressableButton,
  ResumePrompt,
  SHADOWS,
  SPACING,
  Star,
  useCelebrate,
  useGameShell,
  useHintLadder,
  useLevels,
  useSound,
  useTranslation,
} from '@/sdk';
import { CountThisMany } from './components/CountThisMany';
import { HowMany } from './components/HowMany';
import { makeCountAndPopLevels } from './utils/levels';

// A tap-to-continue card only on milestones; every other solve auto-advances.
const MILESTONE_EVERY = 5;
const POINTS_FIRST_TRY = 10;
const POINTS_WITH_HELP = 5;

// ---------------------------------------------------------------------------
// Level-solved overlay — rendered via GameShell 'win' slot.
// ---------------------------------------------------------------------------

type LevelSolvedOverlayProps = {
  onNext: () => void;
  t: ReturnType<typeof useTranslation>['t'];
};

// Endless game — there is no "last level", so the overlay is always the
// celebratory "keep going" form (star + "Next"). The `levelSolved.finish`
// string is retained in the locales for a possible future finite mode.
function LevelSolvedOverlay({
  onNext,
  t,
}: LevelSolvedOverlayProps): React.JSX.Element {
  return (
    <View style={overlayStyles.root}>
      <View style={[overlayStyles.card, SHADOWS.lg]}>
        <EmojiFrame emoji="⭐️" size={72} tint={ACCENTS.pink.tint} />
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
          label={t('count-and-pop:levelSolved.next')}
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

  // -------------------------------------------------------------------------
  // Per-session seed — the ONLY call to Math.random() in the entire game.
  //
  // Rules:
  //   - Created ONCE at component mount via useMemo([]).
  //   - Stored in a ref so startNewGame can replace it without a re-render cycle.
  //   - Changing the seed recreates the LevelSource (new source identity → useLevels
  //     re-derives data for level 1 with the new session's values).
  //   - Tests never reach this code; they call buildLevel / makeCountAndPopLevels
  //     with an explicit fixed seed for determinism.
  // -------------------------------------------------------------------------
  const initialSeed = useMemo(() => Math.floor(Math.random() * 0x7fffffff), []);
  const sessionSeedRef = useRef(initialSeed);
  const [sessionSeed, setSessionSeed] = useState(initialSeed);

  // Recreate the LevelSource whenever the session seed changes (i.e. on new game).
  // useMemo on [sessionSeed] keeps the source identity stable across re-renders
  // within the same session, which is required for useLevels' data memo to work.
  const source = useMemo(() => makeCountAndPopLevels(sessionSeed), [sessionSeed]);

  const {
    status,
    data,
    level,
    score,
    start,
    startOver,
    advance,
    addScore,
  } = useLevels({
    gameId: 'count-and-pop',
    source,
  });

  // Which choice index the player tapped (null = unanswered this round).
  // Also used as a guard: if not null, ignore further taps.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Prevents double-advance after the level is already won.
  const [solved, setSolved] = useState(false);

  // Shared hint policy for wrong answers, reset every level.
  const hints = useHintLadder(level);
  const [revealCorrect, setRevealCorrect] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const celebrate = useCelebrate();
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);

  // Shake animation for wrong answers (translateX on round view)
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Solve-pop spring animation for correct answers (scale on round view)
  const solvePopAnim = useRef(new Animated.Value(1)).current;

  // Pending setTimeout ids — cleared on unmount.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Keep the GameShell HUD score display in sync.
  useEffect(() => {
    // Only while playing — see shape-detective.
    shell.setScore(status === 'playing' ? score : null);
  }, [score, shell, status]);

  // When the level advances, dismiss the win overlay and reset selection/solved.
  useEffect(() => {
    shell.hideOverlay('win');
    setSelectedIndex(null);
    setSolved(false);
    setRevealCorrect(false);
    setHintIndex(null);
    // Reset juice anims for fresh level
    shakeAnim.setValue(0);
    solvePopAnim.setValue(1);
  }, [level, shell, shakeAnim, solvePopAnim]);

  // Clear any pending timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  // Endless: always advance to the next level.
  // isLast is permanently false (source.count is undefined), so the "finish"
  // branch is dead — we keep it typed but never reached, which lets the
  // LevelSolvedOverlay always show the "Next" label correctly.
  const handleNext = useCallback(() => {
    shell.hideOverlay('win');
    advance();
  }, [advance, shell]);

  // startNewGame: re-roll the session seed then reset to level 1.
  // Each call to startOver() reuses the SAME session seed (resume-friendly).
  // Only this explicit new-game path generates a brand-new seed.
  // NOTE: This is the second (and only other) place a random number is produced —
  // it is still in the React host, never in the pure domain layer.
  const startNewGame = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 0x7fffffff);
    sessionSeedRef.current = newSeed;
    setSessionSeed(newSeed);
    startOver();
  }, [startOver]);

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

  // Solve-pop spring — gentle scale bounce on correct answer.
  const triggerSolvePop = useCallback(() => {
    solvePopAnim.setValue(1);
    Animated.sequence([
      Animated.timing(solvePopAnim, {
        toValue: 1.04,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(solvePopAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 10,
      }),
    ]).start();
  }, [solvePopAnim]);

  // Shared correct-answer handler — used by both mode types.
  // In endless mode isLast is always false; always play 'success'.
  const handleCorrect = useCallback(() => {
    void play('success');
    addScore(hints.firstTry ? POINTS_FIRST_TRY : POINTS_WITH_HELP);
    setSolved(true);
    setHintIndex(null);
    triggerSolvePop();
    if (timerRef.current !== null) clearTimeout(timerRef.current);

    if (level % MILESTONE_EVERY === 0) {
      // Milestone: big confetti, then the tap-to-continue card.
      void celebrate('big', { praise: false });
      timerRef.current = setTimeout(() => {
        shell.showOverlay(
          'win',
          <LevelSolvedOverlay onNext={handleNext} t={t} />,
        );
      }, 600);
      return;
    }

    // Ordinary solve: a quick burst + praise, then straight on — no modal.
    void celebrate('small').then(() => {
      if (mounted.current) advance();
    });
  }, [play, addScore, hints.firstTry, level, celebrate, shell, handleNext, t, triggerSolvePop, advance]);

  // handlePick: used by HowMany (choice-row modes).
  // Guards on `selectedIndex !== null || solved` to prevent double-advance.
  const handlePick = useCallback(
    (idx: number) => {
      if (selectedIndex !== null || solved) return;

      setSelectedIndex(idx);

      const { round } = data;
      // Only choice-row modes have correctIndex; countThisMany never calls handlePick.
      if (!('correctIndex' in round)) return;

      if (idx === round.correctIndex) {
        handleCorrect();
      } else {
        const step = hints.miss();
        void play('wrong');
        triggerShake();
        setRevealCorrect(step === 'reveal');
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setSelectedIndex(null);
          // From the 2nd miss on, keep pointing at the answer until it's tapped.
          if (step !== 'retry') setHintIndex(round.correctIndex);
        }, 900);
      }
    },
    [selectedIndex, solved, data, handleCorrect, hints, play, triggerShake],
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
        {/* startNewGame re-seeds so a fresh game always feels different. */}
        <ResumePrompt level={level} onContinue={start} onStartOver={startNewGame} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Round dispatcher
  // ---------------------------------------------------------------------------

  const { round } = data;

  // Lulu reacts to mistakes: encourages after the first miss, then points at the
  // answer once the hint ladder starts helping. She stays out of the way otherwise.
  const helper = (
    <MascotHelper pose={hints.step && !solved ? (hints.step === 'retry' ? 'encourage' : 'point') : null} size={110} />
  );

  if (round.mode === 'countThisMany') {
    return (
      <Animated.View
        style={[
          styles.root,
          {
            transform: [
              { translateX: shakeAnim },
              { scale: solvePopAnim },
            ],
          },
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
        {
          transform: [
            { translateX: shakeAnim },
            { scale: solvePopAnim },
          ],
        },
      ]}
    >
      <HowMany
        round={round}
        selectedIndex={selectedIndex}
        onPick={handlePick}
        disabled={solved}
        revealCorrect={revealCorrect}
        hintIndex={hintIndex}
      />
      {helper}
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
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
});
