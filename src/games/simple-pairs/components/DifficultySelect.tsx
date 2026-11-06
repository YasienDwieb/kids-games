import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIG, GAME_COLORS } from '../constants';
import { PressableButton, EmojiFrame } from '../../../components/common';
import { BORDER_RADIUS, COLORS, OUTLINE, SPACING, TOUCH_TARGET } from '../../../constants';
import type { AccentName } from '../../../constants';
import { useTranslation } from '@/sdk';

type DifficultySelectProps = {
  onSelect: (difficulty: Difficulty) => void;
};

const LEVELS: { difficulty: Difficulty; emoji: string; accent: AccentName }[] = [
  { difficulty: 'easy', emoji: '🐣', accent: 'green' },
  { difficulty: 'medium', emoji: '🐥', accent: 'orange' },
  { difficulty: 'hard', emoji: '🦁', accent: 'coral' },
  { difficulty: 'expert', emoji: '🏆', accent: 'purple' },
];

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  // Landscape: clear the floating BackButton (start inset + md + 64 + gap) on
  // both sides so the grid stays centered and never slides under it.
  const sideGutter =
    Math.max(insets.left, insets.right) + SPACING.md + TOUCH_TARGET.recommended + SPACING.md;

  return (
    <View
      style={[
        styles.container,
        landscape
          ? {
              paddingTop: insets.top + SPACING.xs,
              paddingBottom: insets.bottom + SPACING.sm,
              paddingHorizontal: sideGutter,
            }
          : { paddingTop: insets.top + SPACING.xxl },
      ]}
    >
      <ScrollView
        contentContainerStyle={[styles.options, landscape && styles.optionsLandscape]}
        showsVerticalScrollIndicator={false}
      >
        {LEVELS.map(({ difficulty, emoji, accent }) => {
          const pairs = DIFFICULTY_CONFIG[difficulty].pairs;
          const cards = pairs * 2;
          return (
            <PressableButton
              key={difficulty}
              accent={accent}
              align="flex-start"
              accessibilityLabel={`${t(`simple-pairs:difficulty.${difficulty}`)}, ${t('simple-pairs:difficulty.meta', { pairs, cards })}`}
              onPress={() => onSelect(difficulty)}
              style={landscape ? styles.buttonLandscape : styles.button}
            >
              <EmojiFrame
                emoji={emoji}
                size={landscape ? 40 : 52}
                fontSize={landscape ? 24 : 30}
                radius={14}
                tint="rgba(255,255,255,0.25)"
              />
              {/* One little card per card in the game: more cards, harder game. */}
              <View style={styles.pips}>
                {Array.from({ length: cards }, (_, i) => (
                  <View key={i} style={styles.pip} />
                ))}
              </View>
            </PressableButton>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
    paddingHorizontal: 22,
  },
  options: {
    gap: 14,
    paddingBottom: SPACING.xl,
  },
  // Landscape: centered 2x2 grid, capped so buttons don't stretch edge to edge.
  optionsLandscape: {
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'space-between',
    rowGap: SPACING.md,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingBottom: 0,
  },
  button: { width: '100%' },
  buttonLandscape: { width: '48.5%' },
  pips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pip: {
    width: 12,
    height: 16,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
});
