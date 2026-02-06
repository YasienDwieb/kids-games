import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameArea } from './components/GameArea';
import { useGameState } from './hooks/useGameState';
import { COLORS, FONT_SIZES, SPACING } from '../../constants';

export default function TemplateGame() {
  const { isPlaying, score, start, reset } = useGameState();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backText}>← Back</Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      <GameArea>
        <Text style={styles.title}>Template Game</Text>
        <Text style={styles.subtitle}>
          {isPlaying ? 'Game is running!' : 'Tap to start'}
        </Text>
      </GameArea>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.md,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  scoreText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
