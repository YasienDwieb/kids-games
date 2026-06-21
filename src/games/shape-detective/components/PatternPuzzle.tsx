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
import type { PatternPuzzle as PatternPuzzleData } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PatternPuzzleProps = {
  puzzle: PatternPuzzleData;
  /** Index into puzzle.options the player tapped (null = not yet answered). */
  selectedIndex: number | null;
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
  onPick,
  disabled = false,
}: PatternPuzzleProps): React.JSX.Element {
  const { t } = useTranslation();
  // Landscape (guided flow): tighten vertical rhythm and keep options on one
  // row so the sequence + choices fit the shorter height without clipping.
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  // The separator arrow points toward the question slot.
  // In LTR the sequence renders left→right so the arrow (→) points right toward ?.
  // In RTL the sequence row reverses naturally via flex, placing ? on the physical
  // left; the arrow (←) correctly points left toward ?.
  const arrowGlyph = I18nManager.isRTL ? '←' : '→';

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      {/* Instruction */}
      <Text style={styles.instruction}>{t('shape-detective:pattern.instruction')}</Text>

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

      {/* Divider + choose label */}
      <Text style={styles.chooseLabel}>{t('shape-detective:pattern.choose')}</Text>

      {/* Options */}
      <View style={[styles.optionsRow, landscape && styles.optionsRowLandscape]}>
        {puzzle.options.map((shape, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === puzzle.correctIndex;
          // After a pick: reveal correct=green, wrong=coral
          const revealed = selectedIndex !== null;
          // Build border color as a plain string to avoid const-literal mismatches
          const borderColor: string = revealed && isCorrect
            ? ACCENTS.green.base
            : revealed && isSelected && !isCorrect
            ? ACCENTS.coral.base
            : COLORS.line2;

          const borderWidth = isSelected || (revealed && isCorrect) ? 3 : 2;

          const kindLabel = t(`shape-detective:shapes.kind.${shape.kind}`);
          const sizeLabel = t(`shape-detective:shapes.size.${shape.size}`);

          return (
            <View
              key={idx}
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
                onPress={() => onPick(idx)}
                disabled={disabled || selectedIndex !== null}
                style={{
                  ...styles.optionButton,
                  borderColor,
                  borderWidth,
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
  instruction: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    textAlign: 'center',
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
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  questionSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderStyle: 'dashed',
    borderWidth: 2.5,
    borderColor: ACCENTS.purple.base,
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
  chooseLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
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
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.surface,
    minWidth: SHAPE_SIZE_PX.large + SPACING.md * 2,
    minHeight: SHAPE_SIZE_PX.large + SPACING.md * 2,
  },
});
