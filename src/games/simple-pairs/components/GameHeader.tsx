import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HudPill, hudTextStyle, IconButton } from '../../../components/common';
import { SPACING } from '../../../constants';

type GameHeaderProps = {
  found: number;
  total: number;
  moves: number;
  onReset: () => void;
};

export function GameHeader({ found, total, moves, onReset }: GameHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <IconButton glyph="↻" onPress={onReset} accessibilityLabel="Restart" />
      </View>

      <View style={styles.hudRow}>
        <HudPill>
          <Text style={styles.icon}>🃏</Text>
          <Text style={hudTextStyle}>
            {found}/{total} pairs
          </Text>
        </HudPill>
        <HudPill>
          <Text style={styles.icon}>👆</Text>
          <Text style={hudTextStyle}>
            {moves} {moves === 1 ? 'move' : 'moves'}
          </Text>
        </HudPill>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingTop: SPACING.sm,
  },
  icon: { fontSize: 17 },
});
