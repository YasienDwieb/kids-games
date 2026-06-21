/**
 * CountThisMany — renders the "pop exactly N" mode.
 *
 * Layout:
 *   ┌──────────────────────────────┐
 *   │ Prompt card                  │  ← "TAP THIS MANY / Pop 5 apples!" + big pink numeral
 *   │ Progress pips   3 / 5        │  ← done=green, current=pink pulsing, empty=faint
 *   │ Object grid (≤3 cols)        │  ← tappable CountObject tiles
 *   └──────────────────────────────┘
 *
 * Logic:
 *   - Shows `target + overflow` tiles (at least 3 extras, max MAX_OBJECTS).
 *   - Player pops tiles one by one; `popped` count increments.
 *   - Over-pop is impossible: once popped === target, remaining tiles are disabled.
 *   - Calls `onSolved()` exactly when popped === target.
 *   - Calls `onPop(newCount)` on every successful pop (host plays sfx.pop).
 *
 * RTL: the grid uses natural flex wrap (no direction pin). Absolute grid coords
 * do not apply here — flex wrap reflows tiles correctly in both directions.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONTS,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import { CountObject } from './CountObject';
import type { CountThisManyRound } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CountThisManyProps = {
  round: CountThisManyRound;
  /** Called with the updated pop count on each pop. */
  onPop: (count: number) => void;
  /** Called when the player has popped exactly `round.target` tiles. */
  onSolved: () => void;
  /** When true, no further interaction allowed (e.g. overlay is showing). */
  disabled?: boolean;
};

// ---------------------------------------------------------------------------
// Pip progress bar
// ---------------------------------------------------------------------------

function ProgressPips({
  target,
  popped,
}: {
  target: number;
  popped: number;
}): React.JSX.Element {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse the "current" pip
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={pipStyles.row}>
      {Array.from({ length: target }, (_, i) => {
        const isDone = i < popped;
        const isCurrent = i === popped && popped < target;
        if (isCurrent) {
          return (
            <Animated.View
              key={i}
              style={[
                pipStyles.pip,
                pipStyles.pipCurrent,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
          );
        }
        return (
          <View
            key={i}
            style={[
              pipStyles.pip,
              isDone ? pipStyles.pipDone : pipStyles.pipEmpty,
            ]}
          />
        );
      })}
    </View>
  );
}

const pipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pip: {
    width: 14,
    height: 14,
    borderRadius: BORDER_RADIUS.full,
  },
  pipDone: {
    backgroundColor: ACCENTS.green.base,
  },
  pipCurrent: {
    backgroundColor: ACCENTS.pink.base,
  },
  pipEmpty: {
    backgroundColor: COLORS.line2,
    borderWidth: 2,
    borderColor: COLORS.inkFaint,
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// Overflow: show a few extra tiles beyond target so the grid looks full
const OVERFLOW = 3;

export function CountThisMany({
  round,
  onPop,
  onSolved,
  disabled = false,
}: CountThisManyProps): React.JSX.Element {
  const { t } = useTranslation();
  const { target, objectEmoji } = round;
  // Landscape (e.g. guided flow): tighten vertical rhythm and use the width so
  // the prompt + tiles fit the shorter height instead of wrapping/clipping.
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  // Tile count: target + OVERFLOW, capped at 10 so the grid stays manageable
  const tileCount = Math.min(target + OVERFLOW, 10);

  const [poppedSet, setPoppedSet] = useState<Set<number>>(new Set());
  const solvedRef = useRef(false);

  // Reset when the round changes
  useEffect(() => {
    setPoppedSet(new Set());
    solvedRef.current = false;
  }, [round]);

  // Side-effects (onPop/onSolved) are deferred to an effect so they never run
  // inside the setPoppedSet updater (which executes during render — calling a
  // parent setState there throws "Cannot update a component while rendering a
  // different component"). The effect fires after commit, when it's safe.
  const pendingPopRef = useRef<number | null>(null);

  const handlePop = useCallback((index: number) => {
    if (solvedRef.current) return;

    setPoppedSet((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      pendingPopRef.current = next.size; // signal: a pop landed this commit
      return next;
    });
  }, []);

  // After the popped set commits, notify the host (pop sound + solve check).
  useEffect(() => {
    const newCount = pendingPopRef.current;
    if (newCount === null) return;
    pendingPopRef.current = null;

    onPop(newCount);
    if (newCount >= target && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [poppedSet, target, onPop, onSolved]);

  const poppedCount = poppedSet.size;
  const allDone = poppedCount >= target;

  // Bob animation on the target numeral chip
  const bobAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -5,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bobAnim]);

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      {/* Prompt card */}
      <View style={[styles.promptCard, landscape && styles.promptCardLandscape, SHADOWS.md]}>
        <Text style={styles.promptTitle}>
          {t('count-and-pop:countThisMany.title')}
        </Text>
        <View style={styles.promptRow}>
          <Text style={styles.promptInstruction}>
            {t('count-and-pop:countThisMany.instruction', {
              count: target,
              emoji: objectEmoji,
            })}
          </Text>
          {/* Big bobbing pink numeral chip */}
          <Animated.View
            style={[
              styles.numeralChip,
              SHADOWS.sm,
              { transform: [{ translateY: bobAnim }] },
            ]}
          >
            <Text style={styles.numeralText}>{target}</Text>
          </Animated.View>
        </View>
      </View>

      {/* Progress pips + count label */}
      <View style={styles.progressSection}>
        <ProgressPips target={target} popped={poppedCount} />
        <Text style={styles.progressLabel}>
          {t('count-and-pop:countThisMany.progress', {
            popped: poppedCount,
            target,
          })}
        </Text>
      </View>

      {/* Object grid */}
      <View style={[styles.grid, landscape && styles.gridLandscape]}>
        {Array.from({ length: tileCount }, (_, i) => {
          const isPopped = poppedSet.has(i);
          // Lock unpopped tiles once we've reached the target
          const isDisabled = disabled || (allDone && !isPopped);
          const a11yLabel = isPopped
            ? t('count-and-pop:a11y.objectPopped', { emoji: objectEmoji })
            : t('count-and-pop:a11y.objectTile', { emoji: objectEmoji });
          return (
            <CountObject
              key={i}
              emoji={objectEmoji}
              popped={isPopped}
              onPop={() => handlePop(i)}
              disabled={isDisabled}
              accessibilityLabel={a11yLabel}
            />
          );
        })}
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.canvas,
  },
  // Landscape: distribute sections evenly across the height (device-agnostic).
  rootLandscape: {
    justifyContent: 'space-evenly',
    gap: 0,
    paddingVertical: SPACING.xs,
    backgroundColor: 'transparent',
  },
  promptCardLandscape: { maxWidth: 560 },
  gridLandscape: { maxWidth: 760 },
  // Prompt card — pink gradient bg approximated with ACCENTS.pink.tint + border
  promptCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: ACCENTS.pink.tint,
    borderWidth: 2,
    borderColor: ACCENTS.pink.base,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  promptTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.sm,
    color: ACCENTS.pink.deep,
    textAlign: 'center',
    letterSpacing: 1,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  promptInstruction: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    textAlign: 'center',
    flex: 1,
  },
  numeralChip: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.soft,
    backgroundColor: ACCENTS.pink.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeralText: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.surface,
    lineHeight: FONT_SIZES.xl + 4,
  },
  // Progress
  progressSection: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  progressLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  // Object grid — wrapping flex row, 3 columns max
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    maxWidth: 420,
  },
});
