/**
 * OddOneOutPuzzle — "find the shape that doesn't belong"
 *
 * Layout (portrait-friendly):
 *   ┌─────────────────────────────────────────────┐
 *   │  instruction label                          │
 *   │                                             │
 *   │  ┌────┐  ┌────┐  ┌────┐  ┌────┐           │  ← grid of shapes
 *   │  │    │  │    │  │    │  │    │           │
 *   │  └────┘  └────┘  └────┘  └────┘           │
 *   │  ┌────┐  ┌────┐                            │
 *   │  │    │  │    │                            │
 *   │  └────┘  └────┘                            │
 *   └─────────────────────────────────────────────┘
 *
 * Correct answer highlighted green, wrong answer highlighted coral.
 * The grid uses standard flex wrapping — no directional meaning so
 * standard RTL mirroring is fine for the item grid.
 *
 * Prop contract mirrors PatternPuzzle: puzzle / selectedIndex / onPick / disabled.
 */

import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  FONT_SIZES,
  PressableButton,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import { ShapeView } from './ShapeView';
import { SHAPE_SIZE_PX } from '../constants';
import type { OddOneOutPuzzle as OddOneOutPuzzleData } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OddOneOutPuzzleProps = {
  puzzle: OddOneOutPuzzleData;
  /** Index the player has tapped (null = not yet answered). */
  selectedIndex: number | null;
  /** Called when the player taps an item. */
  onPick: (index: number) => void;
  /** Ignore taps (post-answer cooldown). */
  disabled?: boolean;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OddOneOutPuzzle({
  puzzle,
  selectedIndex,
  onPick,
  disabled = false,
}: OddOneOutPuzzleProps): React.JSX.Element {
  const { t } = useTranslation();
  // Landscape (guided flow): tighten vertical rhythm so the grid isn't clipped.
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      {/* Instruction */}
      <Text style={styles.instruction}>{t('shape-detective:oddOneOut.instruction')}</Text>

      {/* Shape grid */}
      <View style={styles.grid}>
        {puzzle.items.map((shape, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === puzzle.correctIndex;
          const revealed = selectedIndex !== null;

          // Border feedback: correct = green, selected-wrong = coral, neutral = line2
          const borderColor: string =
            revealed && isCorrect
              ? ACCENTS.green.base
              : revealed && isSelected && !isCorrect
              ? ACCENTS.coral.base
              : COLORS.line2;

          const borderWidth = isSelected || (revealed && isCorrect) ? 3 : 2;

          // Background tint when revealed
          const backgroundColor: string =
            revealed && isCorrect
              ? ACCENTS.green.tint
              : revealed && isSelected && !isCorrect
              ? ACCENTS.coral.tint
              : COLORS.surface;

          return (
            <View
              key={idx}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('shape-detective:oddOneOut.itemLabel', {
                index: idx + 1,
                kind: t(`shape-detective:shapes.kind.${shape.kind}`),
                size: t(`shape-detective:shapes.size.${shape.size}`),
              })}
            >
              <PressableButton
                onPress={() => onPick(idx)}
                disabled={disabled || selectedIndex !== null}
                style={{
                  ...styles.itemButton,
                  borderColor,
                  borderWidth,
                  backgroundColor,
                }}
              >
                <ShapeView shape={shape} />
              </PressableButton>
            </View>
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
  },
  rootLandscape: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  instruction: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  itemButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.card,
    // backgroundColor set inline above
    minWidth: SHAPE_SIZE_PX.large + SPACING.md * 2,
    minHeight: SHAPE_SIZE_PX.large + SPACING.md * 2,
    ...SHADOWS.sm,
  },
});
