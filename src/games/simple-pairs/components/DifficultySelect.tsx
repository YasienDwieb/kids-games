import React from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIG, GAME_COLORS } from '../constants';
import { PressableButton, EmojiFrame } from '../../../components/common';
import { COLORS, FONTS, SPACING } from '../../../constants';
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

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: landscape
            ? insets.top + SPACING.sm
            : insets.top + SPACING.xxl,
        },
      ]}
    >
      <Text style={[styles.title, landscape && styles.titleLandscape]}>
        {t('simple-pairs:difficulty.select.title')}
      </Text>
      {!landscape && (
        <Text style={styles.subtitle}>{t('simple-pairs:difficulty.select.subtitle')}</Text>
      )}

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
              <View style={styles.labelCol}>
                <Text style={[styles.levelName, landscape && styles.levelNameLandscape]}>
                  {t(`simple-pairs:difficulty.${difficulty}`)}
                </Text>
                <Text style={styles.levelMeta}>
                  {t('simple-pairs:difficulty.meta', { pairs, cards })}
                </Text>
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
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 30,
    color: COLORS.ink,
    textAlign: 'center',
  },
  titleLandscape: {
    fontSize: 22,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  options: {
    gap: 14,
    paddingBottom: SPACING.xl,
  },
  // Landscape: 2-column grid so all 4 difficulty buttons fit without scrolling.
  optionsLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-evenly',
  },
  button: { width: '100%' },
  // Landscape: each button takes ~48% of the width so 2 fit per row.
  buttonLandscape: { width: '47%' },
  labelCol: { gap: 2 },
  levelName: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.surface,
  },
  levelNameLandscape: {
    fontSize: 16,
  },
  levelMeta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
  },
});
