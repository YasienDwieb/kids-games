import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIG, GAME_COLORS } from '../constants';
import { ClayEmoji } from '../../../components/common';
import { ACCENTS, BORDER_RADIUS, COLORS, OUTLINE, SHADOWS, SPACING, TOUCH_TARGET } from '../../../constants';
import type { AccentName } from '../../../constants';
import { useTranslation } from '@/sdk';

type DifficultySelectProps = {
  onSelect: (difficulty: Difficulty) => void;
};

/** A staircase: each level is a taller step, a bigger creature, a bigger fan of cards. */
const STEPS: { difficulty: Difficulty; emoji: string; accent: AccentName; rise: number; creature: number; fan: number }[] = [
  { difficulty: 'easy', emoji: '🐣', accent: 'green', rise: 0.46, creature: 54, fan: 2 },
  { difficulty: 'medium', emoji: '🐥', accent: 'orange', rise: 0.62, creature: 68, fan: 3 },
  { difficulty: 'hard', emoji: '🦁', accent: 'coral', rise: 0.8, creature: 84, fan: 4 },
  { difficulty: 'expert', emoji: '🏆', accent: 'purple', rise: 1, creature: 100, fan: 6 },
];

const CARD_W = 30;
const CARD_H = 42;

/** Face-down cards, fanned from the middle like a hand of cards. */
function CardFan({ count, accent }: { count: number; accent: AccentName }) {
  const mid = (count - 1) / 2;
  return (
    <View style={styles.fan}>
      {Array.from({ length: count }, (_, i) => {
        const off = i - mid;
        return (
          <View
            key={i}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: off * 13 },
                  { translateY: off * off * 2 },
                  { rotate: `${off * 11}deg` },
                ],
              },
            ]}
          >
            <View style={[styles.cardMark, { backgroundColor: ACCENTS[accent].base }]} />
          </View>
        );
      })}
    </View>
  );
}

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  // Clear the floating BackButton (start inset + md + 64 + gap) on both sides.
  const sideGutter =
    Math.max(insets.left, insets.right) + SPACING.md + TOUCH_TARGET.recommended + SPACING.md;
  const tallest = height - insets.top - insets.bottom - SPACING.lg * 2;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + SPACING.lg, paddingHorizontal: sideGutter },
      ]}
    >
      <View style={styles.stairs}>
        {STEPS.map(({ difficulty, emoji, accent, rise, creature, fan }) => {
          const pairs = DIFFICULTY_CONFIG[difficulty].pairs;
          return (
            <Pressable
              key={difficulty}
              onPress={() => onSelect(difficulty)}
              accessibilityRole="button"
              accessibilityLabel={`${t(`simple-pairs:difficulty.${difficulty}`)}, ${t('simple-pairs:difficulty.meta', { pairs, cards: pairs * 2 })}`}
              style={({ pressed }) => [
                styles.step,
                { height: tallest * rise, backgroundColor: ACCENTS[accent].base },
                pressed ? styles.pressed : SHADOWS.md,
              ]}
            >
              <ClayEmoji emoji={emoji} size={Math.min(creature, tallest * rise * 0.46)} />
              <CardFan count={fan} accent={accent} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: GAME_COLORS.background },
  stairs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderTopLeftRadius: BORDER_RADIUS.card,
    borderTopRightRadius: BORDER_RADIUS.card,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderBottomRightRadius: BORDER_RADIUS.sm,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  fan: { width: CARD_W, height: CARD_H + 10, alignItems: 'center' },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  cardMark: { width: 14, height: 14, borderRadius: 3 },
});
