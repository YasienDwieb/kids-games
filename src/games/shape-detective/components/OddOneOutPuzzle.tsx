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

import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  ACCENTS,
  AreaDemo,
  BORDER_RADIUS,
  COLORS,
  currentLanguage,
  HintPulse,
  PressableButton,
  SPACING,
  useGuide,
  useTranslation,
} from '@/sdk';
import { puzzlePhrase } from '../phrase';
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
  /** Option the hint ladder is pointing at. */
  hintIndex: number | null;
  /** Show the answer in green as a wrong pick flashes (the ladder's last step). */
  revealCorrect: boolean;
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
  hintIndex,
  revealCorrect,
  onPick,
  disabled = false,
}: OddOneOutPuzzleProps): React.JSX.Element {
  const { t } = useTranslation();
  // Landscape (guided flow): tighten vertical rhythm so the grid isn't clipped.
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const answered = selectedIndex !== null;
  const guide = useGuide({
    id: 'shape-detective',
    phrase: puzzlePhrase('oddOneOut', currentLanguage()),
    roundKey: puzzle,
    active: !disabled || answered,
  });

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      {/* Shape grid */}
      <View style={styles.grid}>
        {puzzle.items.map((shape, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === puzzle.correctIndex;
          const revealed = answered && (revealCorrect || isSelected);

          // Border feedback: correct = green, selected-wrong = coral, neutral =
          // transparent (PressableButton's face already wears the ink outline).
          const borderColor: string =
            revealed && isCorrect
              ? ACCENTS.green.base
              : revealed && isSelected && !isCorrect
              ? ACCENTS.coral.base
              : 'transparent';

          const borderWidth = isSelected || (revealed && isCorrect) ? 3 : 2;

          // Background tint when revealed
          const backgroundColor: string =
            revealed && isCorrect
              ? ACCENTS.green.tint
              : revealed && isSelected && !isCorrect
              ? ACCENTS.coral.tint
              : COLORS.surface;

          return (
            <HintPulse key={idx} active={hintIndex === idx && !answered}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('shape-detective:oddOneOut.itemLabel', {
                index: idx + 1,
                kind: t(`shape-detective:shapes.kind.${shape.kind}`),
                size: t(`shape-detective:shapes.size.${shape.size}`),
              })}
            >
              <PressableButton
                onPress={() => {
                  guide.poke();
                  onPick(idx);
                }}
                disabled={disabled || selectedIndex !== null}
                // Passed as `color`, not a style background: PressableButton
                // paints its own face, so a background in `style` only tints the
                // 5px socket edge — which meant the green/coral reveal never
                // actually showed.
                color={backgroundColor}
                style={{
                  ...styles.itemButton,
                  borderColor,
                  borderWidth,
                }}
              >
                <View style={styles.itemSlot}>
                  <ShapeView shape={shape} />
                </View>
              </PressableButton>
              {guide.showDemo && idx === puzzle.correctIndex && !answered ? <AreaDemo /> : null}
            </View>
            </HintPulse>
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
  // Landscape: distribute instruction + grid evenly across the height.
  rootLandscape: {
    justifyContent: 'space-evenly',
    gap: 0,
    paddingVertical: SPACING.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  // Fixed slot inside the button face — see PatternPuzzle.optionSlot.
  itemSlot: {
    width: SHAPE_SIZE_PX.large,
    height: SHAPE_SIZE_PX.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemButton: {
    alignItems: 'center',
    justifyContent: 'center',
    // No padding here: this style lands on PressableButton's outer socket, and
    // padding makes the darker edge shade ring the face on all four sides
    // instead of showing only as the intended bottom lip.
    // No SHADOWS here: PressableButton draws its own hard ink drop.
    borderRadius: BORDER_RADIUS.card,
  },
});
