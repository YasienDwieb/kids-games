/**
 * HowMany — renders the choice-row modes: howMany, makeN, addition.
 *
 * Layout:
 *   ┌──────────────────────────────┐
 *   │ Prompt card                  │  ← mode-specific title + instruction
 *   │ Object display               │  ← mode-specific visual:
 *   │   howMany → flat emoji grid (swimming anim)
 *   │   makeN   → GroupCount: filled group + empty slots separated by "+"
 *   │   addition→ GroupCount: two filled groups separated by "+"
 *   │ Choice row                   │  ← 3-4 NumberChoice buttons
 *   └──────────────────────────────┘
 *
 * Used by the host for howMany, makeN, and addition rounds.
 * The host owns sound + advance logic; this component only calls onPick(index).
 *
 * RTL:
 *   - Choice row: standard flex row, no direction pin. Logical indices are
 *     position-independent; correctIndex is never adjusted for visual position.
 *   - Object grid (howMany): flexWrap row — mirrors naturally (identical objects,
 *     no reading order). Safe to mirror.
 *   - GroupCount (makeN/addition): flex row groups with no direction pin — mirrors
 *     naturally; group contents are equal-weight emoji tiles, not ordered sequences.
 *
 * a11y:
 *   - NumberChoice gets accessibilityState.disabled + accessibilityState.selected.
 *   - accessibilityState.selected is true for the correct choice only (post-answer).
 *   - disabled state reflects whether any interaction is possible.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  EmojiImage,
  FONT_SIZES,
  FONTS,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import { NumberChoice } from './NumberChoice';
import { GroupCount } from './GroupCount';
import { FitColumn } from './FitColumn';
import type { NumberChoiceState } from './NumberChoice';
import type {
  HowManyRound,
  MakeNRound,
  AdditionRound,
} from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HowManyRoundVariant = HowManyRound | MakeNRound | AdditionRound;

type HowManyProps = {
  round: HowManyRoundVariant;
  /** Index the player has tapped (null = not yet answered). */
  selectedIndex: number | null;
  /** Called when a choice button is tapped. */
  onPick: (index: number) => void;
  /** Whether tapping should be ignored (post-answer cooldown or overlay). */
  disabled?: boolean;
};

// ---------------------------------------------------------------------------
// Swim animation for the flat howMany object group
// ---------------------------------------------------------------------------

function SwimmingEmoji({
  emoji,
  delayMs,
}: {
  emoji: string;
  delayMs: number;
}): React.JSX.Element {
  const swimAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(swimAnim, {
          toValue: -7,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(swimAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [swimAnim, delayMs]);

  return (
    <Animated.View style={{ transform: [{ translateY: swimAnim }] }}>
      <EmojiImage emoji={emoji} size={44} />
    </Animated.View>
  );
}

const emojiStyles = StyleSheet.create({
  emoji: {
    fontSize: 44,
    lineHeight: 50,
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HowMany({
  round,
  selectedIndex,
  onPick,
  disabled = false,
}: HowManyProps): React.JSX.Element {
  const { t } = useTranslation();
  const { mode, objectEmoji, choices, correctIndex } = round;
  // Landscape (guided flow): tighter vertical rhythm + wider content so the
  // prompt, objects and choices fit the shorter height.
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  // Derive prompt text based on mode
  let promptTitle: string;
  let promptInstruction: string;

  if (mode === 'howMany') {
    promptTitle = t('count-and-pop:howMany.title');
    promptInstruction = t('count-and-pop:howMany.instruction', {
      emoji: objectEmoji,
    });
  } else if (mode === 'makeN') {
    promptTitle = t('count-and-pop:makeN.title');
    promptInstruction = t('count-and-pop:makeN.instruction', {
      needed: round.target - round.have,
      target: round.target,
      emoji: objectEmoji,
    });
  } else {
    // addition
    promptTitle = t('count-and-pop:addition.title');
    promptInstruction = t('count-and-pop:addition.instruction', {
      a: round.a,
      b: round.b,
    });
  }

  // Build per-choice state
  const getChoiceState = (idx: number): NumberChoiceState => {
    if (selectedIndex === null) return 'default';
    if (idx === correctIndex) return 'correct';
    if (idx === selectedIndex) return 'wrong';
    return 'default';
  };

  // For the flat howMany grid: stagger delay per tile
  const howManyCount = mode === 'howMany' ? round.count : 0;
  const swimDelays = Array.from({ length: howManyCount }, (_, i) => i * 300);

  // howMany object grid (shared by both orientations).
  const howManyGrid = (
    <View style={[styles.groupInner, SHADOWS.sm]}>
      <View style={styles.emojiGrid}>
        {swimDelays.map((delay, i) => (
          <SwimmingEmoji key={i} emoji={objectEmoji} delayMs={delay} />
        ))}
      </View>
    </View>
  );

  // Mode-specific object visual.
  //  - Portrait howMany scrolls for large counts (tall column).
  //  - Landscape howMany shows the full grid; FitColumn scales the whole unit
  //    to fit, so no scroll / height cap is needed.
  const objectVisual =
    mode === 'howMany' ? (
      landscape ? (
        <View style={styles.wideLandscape}>{howManyGrid}</View>
      ) : (
        <ScrollView
          scrollEnabled={howManyCount > 9}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.groupCardContent}
          style={styles.groupCard}
        >
          {howManyGrid}
        </ScrollView>
      )
    ) : (
      /* Two-group visual for makeN / addition */
      <GroupCount round={round as MakeNRound | AdditionRound} />
    );

  const body = (
    <>
      {/* Prompt card */}
      <View style={[styles.promptCard, landscape && styles.promptCardLandscape, SHADOWS.md]}>
        <Text style={styles.promptTitle}>{promptTitle}</Text>
        <Text style={styles.promptInstruction}>{promptInstruction}</Text>
      </View>

      {/* Object display */}
      {objectVisual}

      {/* Choice row — no direction pin: equal-option buttons, safe to mirror in RTL */}
      <View style={[styles.choiceRow, landscape && styles.choiceRowLandscape]}>
        {choices.map((value, idx) => {
          const state = getChoiceState(idx);
          const isAnswered = selectedIndex !== null;
          return (
            <NumberChoice
              key={idx}
              value={value}
              state={state}
              onPress={() => onPick(idx)}
              disabled={disabled || isAnswered}
              accessibilityLabel={t('count-and-pop:a11y.choiceButton', {
                value,
              })}
              accessibilityState={{
                disabled: disabled || isAnswered,
                selected: state === 'correct',
              }}
            />
          );
        })}
      </View>
    </>
  );

  // Landscape: scale the whole unit to the available height so the choice row
  // is never pushed off-screen. Portrait keeps its natural scrolling column.
  if (landscape) {
    return <FitColumn contentStyle={styles.unitLandscape}>{body}</FitColumn>;
  }
  return <View style={styles.root}>{body}</View>;
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
  // Landscape unit: natural-height centered column (prompt / visual / choices).
  // FitColumn measures this and scales it down uniformly to fit the available
  // height — device-agnostic, ratio-preserving, no clipping, no pixel budgets.
  unitLandscape: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  // Landscape: let prompt / objects use the available width; trim prompt height.
  wideLandscape: { width: '100%', maxWidth: 720, alignItems: 'center' },
  promptCardLandscape: { maxWidth: 720, paddingVertical: SPACING.xs },
  // Landscape: choice row uses the width; natural height in the centered column.
  choiceRowLandscape: { maxWidth: 720, flexGrow: 0, flexShrink: 0 },
  // Prompt card
  promptCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: ACCENTS.pink.tint,
    borderWidth: 2,
    borderColor: ACCENTS.pink.base,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  promptTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.sm,
    color: ACCENTS.pink.deep,
    textAlign: 'center',
    letterSpacing: 1,
  },
  promptInstruction: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    textAlign: 'center',
  },
  // Object group card (howMany flat grid only)
  groupCard: {
    width: '100%',
    maxWidth: 420,
    flexGrow: 0,
    maxHeight: 200,
  },
  groupCardContent: {
    flexGrow: 0,
  },
  groupInner: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.md,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  // Choice row — centered, equal-width buttons
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: SPACING.sm,
    width: '100%',
    maxWidth: 420,
  },
});
