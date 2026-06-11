import { StyleSheet, Text, View } from 'react-native';
import { ACCENTS, COLORS, SHADOWS } from '@/sdk';
import type { ProgressBarProps } from '../types';

const RAIL_W = 4;
const DOT_SIZE = 14;

// Subtle vertical race-progress rail pinned to the END edge: 🏁 at the top,
// a coral dot rising from the bottom (progress 0) to the flag (progress 1).
// Offsets are symmetric around the rail, so `start` is safe under RTL.
export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={styles.rail} pointerEvents="none">
      <Text style={styles.flag}>🏁</Text>
      <View style={[styles.dot, { top: `${(1 - clamped) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    end: 10,
    top: 128,
    bottom: 128,
    width: RAIL_W,
    borderRadius: RAIL_W / 2,
    backgroundColor: COLORS.line2,
  },
  flag: {
    position: 'absolute',
    top: -26,
    start: -(18 - RAIL_W) / 2,
    fontSize: 16,
    width: 18,
    textAlign: 'center',
  },
  dot: {
    position: 'absolute',
    start: -(DOT_SIZE - RAIL_W) / 2,
    marginTop: -DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: ACCENTS.coral.base,
    borderWidth: 3,
    borderColor: COLORS.surface,
    ...SHADOWS.sm,
  },
});
