/**
 * HowMany — renders the choice-row modes: howMany, makeN, addition.
 *
 * Layout:
 *   ┌──────────────────────────────┐
 *   │ Prompt card                  │  ← mode-specific title + instruction
 *   │ Object group card            │  ← emoji tiles (count/a+b objects, swimming anim)
 *   │ Choice row                   │  ← 3-4 NumberChoice buttons
 *   └──────────────────────────────┘
 *
 * Used by the host for howMany, makeN, and addition rounds.
 * The host owns sound + advance logic; this component only calls onPick(index).
 *
 * RTL: choice row uses standard flex row — no direction pin needed. Logical
 * indices are position-independent; correctIndex is never adjusted for visual
 * position. The object group grid mirrors naturally in RTL, which is correct
 * because a group of identical objects has no reading order.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
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
import { NumberChoice } from './NumberChoice';
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
// Swim animation for object group
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
      <Text style={emojiStyles.emoji}>{emoji}</Text>
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

  // Derive display count and prompt text based on mode
  let displayCount: number;
  let promptTitle: string;
  let promptInstruction: string;

  if (mode === 'howMany') {
    displayCount = round.count;
    promptTitle = t('count-and-pop:howMany.title');
    promptInstruction = t('count-and-pop:howMany.instruction', {
      emoji: objectEmoji,
    });
  } else if (mode === 'makeN') {
    // Show `have` objects; prompt asks how many more to reach target
    displayCount = round.have;
    promptTitle = t('count-and-pop:makeN.title');
    promptInstruction = t('count-and-pop:makeN.instruction', {
      needed: round.target - round.have,
      target: round.target,
      emoji: objectEmoji,
    });
  } else {
    // addition: show a + b as two groups (displayed inline)
    displayCount = round.a + round.b;
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

  // Stagger delay per object tile (swim animation offset)
  const swimDelays = Array.from({ length: displayCount }, (_, i) => i * 300);

  return (
    <View style={styles.root}>
      {/* Prompt card */}
      <View style={[styles.promptCard, SHADOWS.md]}>
        <Text style={styles.promptTitle}>{promptTitle}</Text>
        <Text style={styles.promptInstruction}>{promptInstruction}</Text>
      </View>

      {/* Object group card — scrollable for large counts */}
      <ScrollView
        scrollEnabled={displayCount > 9}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.groupCardContent}
        style={styles.groupCard}
      >
        <View style={[styles.groupInner, SHADOWS.sm]}>
          <View style={styles.emojiGrid}>
            {swimDelays.map((delay, i) => (
              <SwimmingEmoji key={i} emoji={objectEmoji} delayMs={delay} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Choice row */}
      <View style={styles.choiceRow}>
        {choices.map((value, idx) => (
          <NumberChoice
            key={idx}
            value={value}
            state={getChoiceState(idx)}
            onPress={() => onPick(idx)}
            disabled={disabled || selectedIndex !== null}
            accessibilityLabel={t('count-and-pop:a11y.choiceButton', {
              value,
            })}
          />
        ))}
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
  // Object group card
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
  // Choice row
  choiceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    maxWidth: 420,
  },
});
