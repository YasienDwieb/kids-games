import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants';

type GameAreaProps = {
  children: React.ReactNode;
};

export function GameArea({ children }: GameAreaProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
