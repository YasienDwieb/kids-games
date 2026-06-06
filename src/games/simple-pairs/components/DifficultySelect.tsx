import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Difficulty } from '../types';
import { DIFFICULTY_CONFIG, GAME_COLORS } from '../constants';
import { PressableButton, EmojiFrame } from '../../../components/common';
import { COLORS, FONTS, SPACING } from '../../../constants';
import type { AccentName } from '../../../constants';

type DifficultySelectProps = {
  onSelect: (difficulty: Difficulty) => void;
};

const LEVELS: { difficulty: Difficulty; name: string; emoji: string; accent: AccentName }[] = [
  { difficulty: 'easy', name: 'Easy', emoji: '🐣', accent: 'green' },
  { difficulty: 'medium', name: 'Medium', emoji: '🐥', accent: 'orange' },
  { difficulty: 'hard', name: 'Hard', emoji: '🦁', accent: 'coral' },
  { difficulty: 'expert', name: 'Expert', emoji: '🏆', accent: 'purple' },
];

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xxl }]}>
      <Text style={styles.title}>Simple Pairs</Text>
      <Text style={styles.subtitle}>How many pairs can you match?</Text>

      <ScrollView
        contentContainerStyle={styles.options}
        showsVerticalScrollIndicator={false}
      >
        {LEVELS.map(({ difficulty, name, emoji, accent }) => {
          const pairs = DIFFICULTY_CONFIG[difficulty].pairs;
          return (
            <PressableButton
              key={difficulty}
              accent={accent}
              align="flex-start"
              onPress={() => onSelect(difficulty)}
              style={styles.button}
            >
              <EmojiFrame
                emoji={emoji}
                size={52}
                fontSize={30}
                radius={14}
                tint="rgba(255,255,255,0.25)"
              />
              <View style={styles.labelCol}>
                <Text style={styles.levelName}>{name}</Text>
                <Text style={styles.levelMeta}>
                  {pairs} pairs · {pairs * 2} cards
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
  button: { width: '100%' },
  labelCol: { gap: 2 },
  levelName: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.surface,
  },
  levelMeta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
  },
});
