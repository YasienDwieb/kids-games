import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants';

/**
 * Persistent, oversized warm backdrop that hosts the active flow unit, so the
 * guided journey reads as one continuous world as units swap in and out.
 */
export function SceneCanvas({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.root}>
      {/* Oversized backdrop, persistent across units, so the world feels continuous. */}
      <View style={styles.backdrop} pointerEvents="none" />
      {/* Active unit's interactive content. */}
      <View style={styles.overlay}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas, overflow: 'hidden' },
  backdrop: {
    position: 'absolute',
    left: '-10%',
    top: '-10%',
    width: '120%',
    height: '120%',
    backgroundColor: COLORS.canvas,
  },
  overlay: { ...StyleSheet.absoluteFillObject },
});
