/**
 * Animal Safari — host screen.
 *
 * Two round modes ALTERNATE by level (see constants/modeForLevel — odd levels
 * are hearName, even levels are whichSound):
 *   • hearName   — the animal NAME is spoken via useSpeech() (EN/AR, locale-
 *                  aware); the child taps the matching animal among 3 choices.
 *   • whichSound — the animal SOUND is played via useSound() (a real CC0 clip,
 *                  manifest intent 'animal.<id>'); the child taps the animal
 *                  that makes it.
 *
 * Flow (mirrors letter-land):
 *   loading   → loading view
 *   resumable → ResumePrompt (continue / start over)
 *   playing   → current round + score HUD via GameShell
 *
 * The LevelSource is a module-const (animalSafariLevels) — no language branch,
 * since animals are universal and names localize via t() / the spoken name.
 *
 * Determinism lives in the domain (level × 7919 seed, mulberry32) — no
 * Math.random / Date.now in generation. The only timers here are short UI
 * cooldowns, tracked in a single ref and cleared on unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { HearName } from './components/HearName';
import { WhichSound } from './components/WhichSound';
import { LevelSolvedOverlay } from './components/LevelSolvedOverlay';
import { animalSafariLevels } from './utils/levels';
import type { Round } from './types';

// Short post-answer cooldowns (ms) before advancing / clearing a wrong pick.
const SOLVE_DELAY = 700;
const WRONG_RESET_DELAY = 700;

export default function AnimalSafari(): React.JSX.Element {
  const { play } = useSound();
  const shell = useGameShell();
  const { t } = useTranslation();
  const { speak } = useSpeech();

  // Module-const source → stable identity; animals are universal, so no
  // language branch (names localize via t() / the spoken name).
  const source = animalSafariLevels;

  const { status, data, level, score, isLast, start, startOver, advance, addScore } =
    useLevels({ gameId: 'animal-safari', source });

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

  // Present the active round's target:
  //   hearName   → speak the localized animal NAME.
  //   whichSound → play the animal's SFX. play() resolves an intent by TAG, and
  //     each manifest entry 'animal.<id>' is tagged with the bare id (e.g. 'lion'),
  //     so the intent here is the bare animal id, not the manifest key.
  const presentTarget = useCallback(() => {
    if (status !== 'playing') return;
    const round: Round = data.round;
    if (round.mode === 'hearName') {
      void speak(t('animal-safari:names.' + round.target.id));
    } else {
      void play(round.target.id);
    }
  }, [status, data, t, speak, play]);

  // Stable handle to the latest presentTarget so the level-change effect can
  // fire it without listing presentTarget (whose identity churns when t/data
  // change) as a dep — that would otherwise re-present mid-level on
  // react-i18next t churn.
  const presentTargetRef = useRef(presentTarget);
  presentTargetRef.current = presentTarget;

  // Stable handle to the shell so the [level]-only effect can hide the overlay
  // without listing shell as a dep.
  const shellRef = useRef(shell);
  shellRef.current = shell;

  // Keep the shell HUD score in sync.
  useEffect(() => {
    shell.setScore(score);
  }, [score, shell]);

  // On level change ONLY: clear any lingering win overlay, reset
  // selection/solved, and present the new target. Triggered by [level] alone —
  // depending on shell/presentTarget would re-run on identity churn
  // (react-i18next can hand back a new t), re-presenting mid-level. We read the
  // latest presentTarget via a ref so it stays out of the dep list.
  useEffect(() => {
    shellRef.current.hideOverlay('win');
    setSelectedIndex(null);
    setSolved(false);
    presentTargetRef.current();
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
        // The last level should play the win sound; every other correct pick
        // plays success.
        void play(isLast ? 'win' : 'success');
        addScore(10);
        setSolved(true);
        setTimer(() => {
          shell.showOverlay('win', <LevelSolvedOverlay isLast={isLast} onNext={handleNext} />);
        }, SOLVE_DELAY);
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
        <Text style={styles.loading}>{t('animal-safari:loading')}</Text>
      </View>
    );
  }

  if (status === 'resumable') {
    return <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />;
  }

  // status === 'playing' — data is defined. Render by round mode.
  const round = data.round;

  return (
    <View style={styles.root}>
      {round.mode === 'hearName' ? (
        <HearName
          round={round}
          onReplay={presentTarget}
          onPick={handlePick}
          selectedIndex={selectedIndex}
          disabled={solved}
        />
      ) : (
        <WhichSound
          round={round}
          onReplay={presentTarget}
          onPick={handlePick}
          selectedIndex={selectedIndex}
          disabled={solved}
        />
      )}
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
