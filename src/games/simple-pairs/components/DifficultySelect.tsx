import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIG, GAME_COLORS } from '../constants';
import { BigButton } from '../../../components/common';
import { COLORS, FONT_SIZES, SPACING } from '../../../constants';

type DifficultySelectProps = {
  onSelect: (difficulty: Difficulty) => void;
};

const OPTIONS: { difficulty: Difficulty; label: string; color: string; preview: string }[] = [
  {
    difficulty: 'easy',
    label: '🐣  Easy',
    color: COLORS.primary.green,
    preview: `${DIFFICULTY_CONFIG.easy.pairs * 2} cards`,
  },
  {
    difficulty: 'medium',
    label: '🐥  Medium',
    color: COLORS.primary.orange,
    preview: `${DIFFICULTY_CONFIG.medium.pairs * 2} cards`,
  },
  {
    difficulty: 'hard',
    label: '🦁  Hard',
    color: COLORS.primary.red,
    preview: `${DIFFICULTY_CONFIG.hard.pairs * 2} cards`,
  },
  {
    difficulty: 'expert',
    label: '🏆  Expert',
    color: COLORS.primary.purple,
    preview: `${DIFFICULTY_CONFIG.expert.pairs * 2} cards`,
  },
];

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🃏 Simple Pairs</Text>
      <Text style={styles.subtitle}>How many cards?</Text>

      <View style={styles.options}>
        {OPTIONS.map(({ difficulty, label, color, preview }) => (
          <View key={difficulty} style={styles.option}>
            <Text style={styles.cardPreview}>{preview}</Text>
            <BigButton
              title={label}
              onPress={() => onSelect(difficulty)}
              color={color}
              style={styles.button}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: '#558B2F',
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  options: {
    width: '100%',
    maxWidth: 280,
    gap: SPACING.lg,
  },
  option: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardPreview: {
    fontSize: FONT_SIZES.md,
    letterSpacing: 4,
  },
  button: {
    width: '100%',
  },
});
