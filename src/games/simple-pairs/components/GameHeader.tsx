import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, TOUCH_TARGET } from '../../../constants';

type GameHeaderProps = {
  onReset?: () => void;
  title?: string;
};

export function GameHeader({ onReset, title }: GameHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Left spacer — BackButton is rendered by GamePlayerScreen */}
      <View style={styles.spacer} />

      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.spacer} />}

      {onReset ? (
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.resetText}>↻</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  spacer: {
    width: TOUCH_TARGET.recommended,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  resetButton: {
    width: TOUCH_TARGET.recommended,
    height: TOUCH_TARGET.recommended,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
  },
});
