/**
 * PatternPuzzle — renders the "what comes next?" puzzle.
 *
 * Layout (portrait-friendly):
 *   ┌─────────────────────────────────────────────┐
 *   │  instruction label                          │
 *   │                                             │
 *   │  [ A ][ B ][ A ][ B ][ A ][ B ]  [ ? ]    │  ← sequence row + question slot
 *   │                                             │
 *   │  ─────────────── choose: ──────────────    │
 *   │                                             │
 *   │       [ opt0 ]   [ opt1 ]   [ opt2 ]       │  ← options row (tappable)
 *   └─────────────────────────────────────────────┘
 *
 * RTL note: the sequence row uses natural flex mirroring (no direction:'ltr' pin).
 * Shape Detective patterns are attribute cycles (kind/color/size), not spatial
 * timelines — a reversed row is logically identical, and an RTL reader traversing
 * right-to-left lines up with the unchanged correctIndex from generate.ts.
 * The separator arrow flips (→ in LTR, ← in RTL) via I18nManager.isRTL so it
 * always points toward the question slot in the natural reading direction.
 * The options row is purely tappable (no positional meaning) so standard
 * flex mirroring is always correct.
 */

import { I18nManager, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  ACCENTS,
  AreaDemo,
  BORDER_RADIUS,
  COLORS,
  currentLanguage,
  FONTS,
  FONT_SIZES,
  HintPulse,
  OUTLINE,
  PressableButton,
  SHADOWS,
  SPACING,
  useGuide,
  useTranslation,
} from '@/sdk';
import { puzzlePhrase } from '../phrase';
import { ShapeView } from './ShapeView';
import { SHAPE_SIZE_PX } from '../constants';
import type { PatternPuzzle as PatternPuzzleData } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PatternPuzzleProps = {
  puzzle: PatternPuzzleData;
  /** Index into puzzle.options the player tapped (null = not yet answered). */
  selectedIndex: number | null;
  /** Option the hint ladder is pointing at. */
  hintIndex: number | null;
  /** Show the answer in green as a wrong pick flashes (the ladder's last step). */
  revealCorrect: boolean;
  /** Called when the player taps an option. */
  onPick: (index: number) => void;
  /** Whether any tap should be ignored (post-answer cooldown). */
  disabled?: boolean;
};

// ---------------------------------------------------------------------------
// Question-mark slot
// ---------------------------------------------------------------------------

function QuestionSlot(): React.JSX.Element {
  // Match the largest possible shape size so the slot doesn't jump layout
  const px = SHAPE_SIZE_PX.large;
  return (
    <View
      style={[
        styles.questionSlot,
        SHADOWS.sm,
        {
          width: px,
          height: px,
          borderRadius: Math.round(px * 0.18),
        },
      ]}
      accessible
      accessibilityLabel="?"
    >
      <Text style={styles.questionMark}>?</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PatternPuzzle({
  puzzle,
  selectedIndex,
  hintIndex,
  revealCorrect,
  onPick,
  disabled = false,
}: PatternPuzzleProps): React.JSX.Element {
  const { t } = useTranslation();
  // Landscape (guided flow): tighten vertical rhythm and keep options on one
  // row so the sequence + choices fit the shorter height without clipping.
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const answered = selectedIndex !== null;
  const guide = useGuide({
    id: 'shape-detective',
    phrase: puzzlePhrase('pattern', currentLanguage()),
    roundKey: puzzle,
    active: !disabled || answered,
  });

  // The separator arrow points toward the question slot.
  // In LTR the sequence renders left→right so the arrow (→) points right toward ?.
  // In RTL the sequence row reverses naturally via flex, placing ? on the physical
  // left; the arrow (←) correctly points left toward ?.
  const arrowGlyph = I18nManager.isRTL ? '←' : '→';

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      {/* Sequence row — no direction pin; natural RTL flex reversal is correct
          because pattern cycles are attribute-based, not spatial.  An RTL reader
          traverses right-to-left through the reversed row and correctly identifies
          the ? slot as the next element, matching the unchanged correctIndex. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sequenceContent}
        style={styles.sequenceScroll}
      >
        {puzzle.sequence.map((shape, idx) => (
          <View key={idx} style={styles.sequenceItem}>
            <ShapeView
              shape={shape}
              // ShapeView derives the translated label internally when
              // accessibilityLabel is omitted.
            />
          </View>
        ))}
        {/* Separator arrow — flipped in RTL to point toward the question slot */}
        <Text style={styles.arrow}>{arrowGlyph}</Text>
        {/* Question slot */}
        <View style={styles.sequenceItem}>
          <QuestionSlot />
        </View>
      </ScrollView>

      {/* Options */}
      <View style={[styles.optionsRow, landscape && styles.optionsRowLandscape]}>
        {puzzle.options.map((shape, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === puzzle.correctIndex;
          // After a pick: reveal correct=green, wrong=coral
          const revealed = answered && (revealCorrect || isSelected);
          // Build border color as a plain string to avoid const-literal mismatches
          const borderColor: string = revealed && isCorrect
            ? ACCENTS.green.base
            : revealed && isSelected && !isCorrect
            ? ACCENTS.coral.base
            // Default: no extra ring — PressableButton's face already wears
            // the ink outline. Transparent keeps the width so nothing jumps.
            : 'transparent';

          const borderWidth = isSelected || (revealed && isCorrect) ? 3 : 2;

          const kindLabel = t(`shape-detective:shapes.kind.${shape.kind}`);
          const sizeLabel = t(`shape-detective:shapes.size.${shape.size}`);

          return (
            <HintPulse key={idx} active={hintIndex === idx && !answered}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('shape-detective:pattern.optionLabel', {
                index: idx + 1,
                // Pass translated labels so the interpolated string reads in
                // the active language rather than raw enum values.
                kind: kindLabel,
                size: sizeLabel,
              })}
            >
              <PressableButton
                onPress={() => {
                  guide.poke();
                  onPick(idx);
                }}
                disabled={disabled || selectedIndex !== null}
                // Same tile colour as the sequence row above. Children in this
                // band match on total appearance, not abstracted form, so a
                // shape shown on a different background than the one it has to
                // match reads as a different thing. `color` (not the `style`
                // background) because PressableButton paints its own face.
                color={COLORS.canvas2}
                style={{
                  ...styles.optionButton,
                  borderColor,
                  borderWidth,
                }}
              >
                <View style={styles.optionSlot}>
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
  // Landscape: distribute instruction / sequence / options evenly across the
  // height (device-agnostic — no pixel budgets, last row never clipped).
  rootLandscape: {
    justifyContent: 'space-evenly',
    gap: 0,
    paddingVertical: SPACING.xs,
  },
  // Landscape: keep all answer tiles on a single row (plenty of width).
  optionsRowLandscape: {
    flexWrap: 'nowrap',
  },
  // Sequence row
  sequenceScroll: {
    flexGrow: 0,
  },
  sequenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sequenceItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.canvas2,
    borderRadius: BORDER_RADIUS.soft,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  questionSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderStyle: 'dashed',
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  questionMark: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: ACCENTS.purple.base,
  },
  arrow: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    paddingHorizontal: SPACING.xs,
  },
  // Options
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    // No padding here: this style lands on PressableButton's outer socket, and
    // padding makes the darker edge shade ring the face on all four sides
    // instead of showing only as the intended bottom lip.
    borderRadius: BORDER_RADIUS.card,
  },
  // Fixed slot so every tile is the same size whatever the shape's own size is.
  // It lives inside the button face: sizing the socket instead let the face
  // shrink to a small shape and leak the edge shade around it as a nested box.
  optionSlot: {
    width: SHAPE_SIZE_PX.large,
    height: SHAPE_SIZE_PX.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
