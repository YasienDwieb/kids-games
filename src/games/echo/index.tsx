/**
 * Echo — main game screen (bare layout).
 *
 * Phase machine:
 *   idle      → kid presses Start → startGame() → playback
 *   playback  → setTimeout chain lights pads + plays sounds → input
 *   input     → kid taps pads; correct / round-complete / wrong
 *   win       → short celebration delay → advanceRound() → playback
 *   gameover  → show score + Play Again button
 *
 * Timer hygiene: all setTimeout ids go into timerIds (a ref'd Set) and are
 * cleared on unmount AND whenever the game resets — mirrors shape-detective.
 * Best score is persisted via createStore (write-queue pattern from color-mixer).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ACCENTS,
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
  TOUCH_TARGET,
  HudPill,
  hudTextStyle,
  PressableButton,
  EmojiFrame,
  Star,
  createStore,
  useSound,
  useScreenBack,
  useTranslation,
} from '@/sdk';
import { Board } from './components/Board';
import {
  startGame,
  checkInput,
  advanceRound,
  difficultyFor,
} from './utils/engine';
import {
  PAD_SOUND_INTENTS,
  SOUND_CORRECT_SEQUENCE,
  SOUND_WRONG,
} from './constants';
import type { GameState, PadId } from './types';

// ---------------------------------------------------------------------------
// Persistent store (best score only — no useLevels, endless game)
// ---------------------------------------------------------------------------

type EchoStore = { bestScore: number };
const echoStore = createStore<EchoStore>('echo', { bestScore: 0 });

let writeQueue: Promise<unknown> = Promise.resolve();
function persistBestScore(score: number): void {
  writeQueue = writeQueue
    .then(async () => {
      const s = await echoStore.get();
      if (score > (s.bestScore ?? 0)) {
        await echoStore.set({ bestScore: score });
      }
    })
    .catch((e) => console.error('Failed to persist echo store:', e));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EchoGame() {
  const { t } = useTranslation();
  const { play } = useSound();
  const insets = useSafeAreaInsets();

  // ---- game state ----
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [litPads, setLitPads] = useState<ReadonlySet<PadId>>(new Set());
  const [bestScore, setBestScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // Shake animation for wrong-tap feedback
  const shakeX = useRef(new Animated.Value(0)).current;

  // New-best celebration: star-burst scale + fade-in
  const newBestScale = useRef(new Animated.Value(0.4)).current;
  const newBestOpacity = useRef(new Animated.Value(0)).current;

  // Timer cleanup — all setTimeout ids tracked here
  const timerIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  function addTimer(id: ReturnType<typeof setTimeout>): void {
    timerIds.current.add(id);
  }

  function clearAllTimers(): void {
    timerIds.current.forEach((id) => clearTimeout(id));
    timerIds.current.clear();
  }

  // ---- load best score on mount ----
  useEffect(() => {
    echoStore
      .get()
      .then((s) => setBestScore(s.bestScore ?? 0))
      .catch((e) => console.error('Failed to load echo store:', e));

    return () => {
      clearAllTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- playback sequence ----
  const runPlayback = useCallback(
    (state: GameState) => {
      const timing = difficultyFor(state.round);
      const { litMs, gapMs } = timing;
      const { sequence } = state;

      // Each step: light up pad for litMs, then gap for gapMs before next step.
      // After the last step, transition to 'input' phase.
      let cursor = 0;

      function scheduleStep(): void {
        if (cursor >= sequence.length) {
          // Playback done — move to input phase
          setGameState((prev) =>
            prev && prev.phase === 'playback' ? { ...prev, phase: 'input' } : prev,
          );
          return;
        }

        const padId = sequence[cursor];

        // Light the pad + play its sound
        setLitPads(new Set([padId]));
        play(PAD_SOUND_INTENTS[padId] ?? 'pop');

        // After litMs, turn off the pad
        const litTimer = setTimeout(() => {
          timerIds.current.delete(litTimer);
          setLitPads(new Set());

          // After gapMs, move to next step
          const gapTimer = setTimeout(() => {
            timerIds.current.delete(gapTimer);
            cursor += 1;
            scheduleStep();
          }, gapMs);
          addTimer(gapTimer);
        }, litMs);
        addTimer(litTimer);
      }

      // Short lead-in delay before first pad lights
      const leadIn = setTimeout(() => {
        timerIds.current.delete(leadIn);
        scheduleStep();
      }, 400);
      addTimer(leadIn);
    },
    [play],
  );

  // ---- trigger playback whenever phase becomes 'playback' ----
  useEffect(() => {
    if (gameState?.phase === 'playback') {
      runPlayback(gameState);
    }
  // runPlayback is stable (useCallback); gameState reference changes on each
  // phase transition so this fires exactly once per phase entry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, gameState?.round]);

  // ---- shake animation (wrong tap) ----
  const triggerShake = useCallback(() => {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 12, duration: 65, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

  // ---- new-best celebration animation ----
  const triggerNewBestCelebration = useCallback(() => {
    newBestScale.setValue(0.4);
    newBestOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(newBestScale, {
        toValue: 1,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(newBestOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [newBestScale, newBestOpacity]);

  // ---- start game ----
  const handleStart = useCallback(() => {
    clearAllTimers();
    setLitPads(new Set());
    setIsNewBest(false);
    newBestOpacity.setValue(0);
    const state = startGame(Date.now());
    setGameState(state);
  // newBestOpacity is a stable Animated.Value ref — no dep needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- handle pad tap ----
  const handlePadPress = useCallback(
    (padId: PadId) => {
      setGameState((prev) => {
        if (!prev || prev.phase !== 'input') return prev;

        const result = checkInput(prev, padId);

        if (result.result === 'correct') {
          play(PAD_SOUND_INTENTS[padId] ?? 'pop');
          return result.state;
        }

        if (result.result === 'round-complete') {
          play(SOUND_CORRECT_SEQUENCE);
          const completedState = result.state; // phase='win'

          // Update best score
          const newScore = completedState.score;
          setBestScore((prev) => {
            if (newScore > prev) {
              setIsNewBest(true);
              persistBestScore(newScore);
              return newScore;
            }
            return prev;
          });

          // Short celebration delay, then advance to next round
          const celebTimer = setTimeout(() => {
            timerIds.current.delete(celebTimer);
            const nextState = advanceRound(completedState, Date.now() + completedState.round);
            setGameState(nextState);
          }, 600);
          addTimer(celebTimer);

          return completedState;
        }

        // wrong
        play(SOUND_WRONG);
        setLitPads(new Set([padId]));
        triggerShake();

        // Flash the wrong pad briefly then clear
        const flashTimer = setTimeout(() => {
          timerIds.current.delete(flashTimer);
          setLitPads(new Set());
        }, 400);
        addTimer(flashTimer);

        return result.state; // phase='gameover'
      });
    },
    [play, triggerShake],
  );

  // Fire new-best animation when gameover panel mounts with isNewBest=true
  useEffect(() => {
    if (gameState?.phase === 'gameover' && isNewBest) {
      triggerNewBestCelebration();
    }
  // triggerNewBestCelebration is stable; only re-fire if phase/isNewBest change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, isNewBest]);

  // ---- back button: reset to idle if mid-game ----
  useScreenBack(() => {
    if (gameState && gameState.phase !== 'idle') {
      clearAllTimers();
      setLitPads(new Set());
      setGameState(null);
      return true; // consumed — don't navigate away
    }
    return false; // let navigation handle it
  });

  // ---- derived values ----
  const phase = gameState?.phase ?? 'idle';
  const round = gameState?.round ?? 0;
  const score = gameState?.score ?? 0;
  const padCount = gameState?.padCount ?? 3;
  const litMs = gameState ? difficultyFor(gameState.round).litMs : 600;
  const inputDisabled = phase !== 'input';

  // Per-pad accessibility labels — memoized since padCount/t changes rarely.
  // During playback pads are disabled so the label describes that to screen readers.
  const padLabels = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) =>
        inputDisabled
          ? t('echo:pads.labelDisabled', { number: String(i + 1) })
          : t('echo:pads.label', { number: String(i + 1) }),
      ),
    // inputDisabled changes on every phase transition — that's acceptable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, inputDisabled],
  );

  // ---- render helpers ----
  const renderHud = () => (
    <View
      style={styles.hud}
      accessibilityLabel={
        round > 0
          ? t('echo:hud.roundValue', { number: String(round) }) +
            ', ' +
            t('echo:hud.bestValue', { number: String(bestScore) })
          : t('echo:hud.bestValue', { number: String(bestScore) })
      }
      accessibilityRole="text"
    >
      <HudPill>
        <Text style={hudTextStyle}>{t('echo:hud.round')}</Text>
        <Text style={[hudTextStyle, styles.hudValue]}>{round > 0 ? String(round) : '—'}</Text>
      </HudPill>
      <HudPill>
        <Text style={hudTextStyle}>{t('echo:hud.best')}</Text>
        <Text style={[hudTextStyle, styles.hudValue]}>{String(bestScore)}</Text>
      </HudPill>
    </View>
  );

  const renderPhasePill = () => {
    if (phase === 'playback') {
      return (
        <View
          style={[styles.phasePill, styles.phasePillWatch]}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.phasePillEmoji}>👀</Text>
          <Text style={styles.phasePillText}>{t('echo:playback.watch')}</Text>
        </View>
      );
    }
    if (phase === 'input') {
      return (
        <View
          style={[styles.phasePill, styles.phasePillInput]}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.phasePillEmoji}>👆</Text>
          <Text style={styles.phasePillText}>{t('echo:input.yourTurn')}</Text>
        </View>
      );
    }
    return null;
  };

  // ---- layout ----
  return (
    <View style={[styles.root, { paddingTop: insets.top + TOUCH_TARGET.recommended + SPACING.sm }]}>
      {renderHud()}

      <View style={styles.center}>
        {/* Start screen */}
        {phase === 'idle' && (
          <View style={styles.startScreen}>
            <Text style={styles.titleText}>{t('echo:start.title')}</Text>
            <Text style={styles.subtitleText}>{t('echo:start.subtitle')}</Text>
            <PressableButton
              label={t('echo:start.button')}
              accessibilityLabel={t('echo:start.buttonA11y')}
              accent="blue"
              onPress={handleStart}
            />
          </View>
        )}

        {/* Game board (playback / input / win) */}
        {(phase === 'playback' || phase === 'input' || phase === 'win') && gameState && (
          <View style={styles.boardWrapper}>
            {renderPhasePill()}
            <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
              <Board
                padCount={padCount}
                litPads={litPads}
                litMs={litMs}
                disabled={inputDisabled}
                phase={phase === 'playback' ? 'watch' : 'input'}
                inputIndex={gameState.inputIndex}
                sequenceLength={gameState.sequence.length}
                onPadPress={handlePadPress}
                padLabels={padLabels}
              />
            </Animated.View>
          </View>
        )}

        {/* Game over screen */}
        {phase === 'gameover' && (
          <View style={styles.gameoverScreen}>
            <Text style={styles.gameoverTitle}>{t('echo:gameover.title')}</Text>
            <View style={styles.scoreBox}>
              <Text
                style={styles.scoreText}
                accessibilityRole="text"
                accessibilityLiveRegion="assertive"
              >
                {t('echo:gameover.score', { count: String(score) })}
              </Text>
              {isNewBest && (
                <Animated.View
                  style={[
                    styles.newBestRow,
                    { transform: [{ scale: newBestScale }], opacity: newBestOpacity },
                  ]}
                  accessibilityLabel={t('echo:gameover.newBestA11y')}
                  accessibilityRole="text"
                  accessibilityLiveRegion="assertive"
                >
                  <EmojiFrame
                    emoji="🏆"
                    size={44}
                    tint={ACCENTS.blue.tint}
                    style={styles.trophyFrame}
                  />
                  <View style={styles.newBestStars}>
                    <Star size={18} filled />
                    <Star size={22} filled />
                    <Star size={18} filled />
                  </View>
                  <Text style={styles.newBestText}>{t('echo:gameover.newBest')}</Text>
                </Animated.View>
              )}
            </View>
            <PressableButton
              label={t('echo:gameover.playAgain')}
              accessibilityLabel={t('echo:gameover.playAgainA11y')}
              accent="blue"
              onPress={handleStart}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  hudValue: {
    fontFamily: FONTS.displayBold,
    color: COLORS.brand,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Start screen
  startScreen: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  titleText: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.ink,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkSoft,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  // Board
  boardWrapper: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  // Phase pills (Watch / Your Turn banners)
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 8,
  },
  phasePillWatch: {
    backgroundColor: COLORS.ink,
  },
  phasePillInput: {
    backgroundColor: ACCENTS.green.base,
  },
  phasePillEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  phasePillText: {
    fontFamily: FONTS.displayBold,
    fontSize: 19,
    color: COLORS.surface,
    lineHeight: 24,
  },
  // Game over
  gameoverScreen: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  gameoverTitle: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.xl,
    color: COLORS.ink,
    textAlign: 'center',
  },
  scoreBox: {
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.md,
  },
  scoreText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    textAlign: 'center',
  },
  // New-best celebration row
  newBestRow: {
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  trophyFrame: {
    marginBottom: SPACING.xs,
  },
  newBestStars: {
    flexDirection: 'row',
    gap: SPACING.xs / 2,
    alignItems: 'center',
  },
  newBestText: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.gold,
    textAlign: 'center',
  },
});
