import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants';
import { ParallaxBackground, BACKDROP } from './backdrop';

/**
 * Persistent backdrop host for the guided journey: a continuous, gently-drifting
 * parallax world whose tint shifts across journey `progress` (0–1), so the
 * journey reads as one evolving world as units swap in and out.
 */
export function SceneCanvas({
  children,
  progress,
}: {
  children?: ReactNode;
  progress?: number;
}) {
  return (
    <View style={styles.root}>
      <ParallaxBackground progress={progress ?? 0} config={BACKDROP} />
      <View style={styles.overlay}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas, overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFillObject },
});
