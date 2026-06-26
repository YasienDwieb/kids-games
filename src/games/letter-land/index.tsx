/**
 * Letter Land — host screen.
 *
 * Single round mode: hearAndFind — the target letter is spoken (name + example
 * word) and the child taps the matching letter. Every level is hear-and-find.
 *
 * Flow (mirrors shape-detective):
 *   loading   → loading view
 *   resumable → ResumePrompt (continue / start over)
 *   playing   → current round + score HUD via GameShell
 *
 * Letter set switches by LANGUAGE here at the host: Latin when LTR/English,
 * Arabic when RTL. The chosen LevelSource is a module-const (stable identity),
 * picked once via useMemo so useLevels' data memo stays valid.
 *
 * Determinism: the domain uses a fixed seed (level × 7919) — no Math.random /
 * Date.now / timers in generation. The only timers here are short UI cooldowns,
 * tracked in a single ref and cleared on unmount.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  ResumePrompt,
  SPACING,
  useGameShell,
  useLevels,
  useSound,
  useSpeech,
  useTranslation,
} from '@/sdk';
import { HearAndFind } from './components/HearAndFind';
import { LevelSolvedOverlay } from './components/LevelSolvedOverlay';
import { LATIN_LEVELS, ARABIC_LEVELS } from './utils/levels';
import type { Letter } from './types';

// Short post-answer cooldowns (ms) before advancing / clearing a wrong pick.
const SOLVE_DELAY_HEAR = 700;
const WRONG_RESET_DELAY = 700;

export default function LetterLand(): React.JSX.Element {
  const { play } = useSound();
  const shell = useGameShell();
  const { t } = useTranslation();
  const { speak } = useSpeech();

  // Letter set by language: Arabic under RTL, Latin otherwise. Module-const
  // sources → stable identity; useMemo keeps it constant across re-renders.
  const source = useMemo(() => (I18nManager.isRTL ? ARABIC_LEVELS : LATIN_LEVELS), []);

  const { status, data, level, score, isLast, start, startOver, advance, addScore } = useLevels({
    gameId: 'letter-land',
    source,
  });

  // Which choice the player tapped this round (null = unanswered).
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Set once a level is solved; prevents double-advance.
  const [solved, setSolved] = useState(false);

  // Single timer ref — cleared before reassign and on unmount.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTimer = useCallback((fn: () => void, ms: number) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);

  // Build + speak the spoken prompt for the active hearAndFind target.
  // Speak the localized letter NAME (not the bare glyph) so TTS says the
  // letter's name reliably — the glyph alone makes the voice guess a phoneme
  // (wrong for Arabic, e.g. ع, and fragile for English). Then the example word.
  const speakTarget = useCallback(() => {
    if (status !== 'playing') return;
    const target: Letter = data.round.target;
    const name = t('letter-land:names.' + target.id);
    const word = t('letter-land:words.' + target.word);
    void speak(`${name}. ${word}`);
  }, [status, data, t, speak]);

  // Stable handle to the latest speakTarget so the level-change effect can fire
  // it without listing speakTarget (whose identity churns when t/data change)
  // as a dep — that previously re-spoke mid-level on react-i18next t churn.
  const speakTargetRef = useRef(speakTarget);
  speakTargetRef.current = speakTarget;

  // Stable handle to the shell so the [level]-only effect can hide the overlay
  // without listing shell as a dep.
  const shellRef = useRef(shell);
  shellRef.current = shell;

  // Keep the shell HUD score in sync.
  useEffect(() => {
    shell.setScore(score);
  }, [score, shell]);

  // On level change ONLY: clear any lingering win overlay, reset
  // selection/solved, and speak the new target (hearAndFind). Triggered by
  // [level] alone — depending on shell/speakTarget would re-run on identity
  // churn (react-i18next can hand back a new t), re-speaking mid-level. We read
  // the latest speakTarget via a ref so it stays out of the dep list.
  useEffect(() => {
    shellRef.current.hideOverlay('win');
    setSelectedIndex(null);
    setSolved(false);
    speakTargetRef.current();
  }, [level]);

  // Clear any pending timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // handleNext reads isLast at call time (live closure).
  const handleNext = useCallback(() => {
    shell.hideOverlay('win');
    if (isLast) {
      startOver();
    } else {
      advance();
    }
  }, [isLast, advance, startOver, shell]);

  const handlePick = useCallback(
    (idx: number) => {
      if (selectedIndex !== null || solved) return;
      if (status !== 'playing') return;
      setSelectedIndex(idx);
      if (idx === data.round.correctIndex) {
        // The last level is a hearAndFind round too, so the final correct pick
        // should play the win sound; every other correct pick plays success.
        void play(isLast ? 'win' : 'success');
        addScore(10);
        setSolved(true);
        setTimer(() => {
          shell.showOverlay('win', <LevelSolvedOverlay isLast={isLast} onNext={handleNext} />);
        }, SOLVE_DELAY_HEAR);
      } else {
        void play('wrong');
        setTimer(() => setSelectedIndex(null), WRONG_RESET_DELAY);
      }
    },
    [selectedIndex, solved, status, data, isLast, play, addScore, setTimer, shell, handleNext],
  );

  // -------------------------------------------------------------------------
  // Status gating
  // -------------------------------------------------------------------------

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{t('letter-land:loading')}</Text>
      </View>
    );
  }

  if (status === 'resumable') {
    return <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />;
  }

  // status === 'playing' — data is defined. Every round is hearAndFind.
  const round = data.round;

  return (
    <View style={styles.root}>
      <HearAndFind
        round={round}
        onReplay={speakTarget}
        onPick={handlePick}
        selectedIndex={selectedIndex}
        disabled={solved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loading: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
});
