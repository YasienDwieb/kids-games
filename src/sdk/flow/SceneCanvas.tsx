import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants';
import { ParallaxBackground, BACKDROP } from './backdrop';
import { useOccasion } from '@/sdk/occasion/useActiveOccasion';
import { Garland } from '@/sdk/occasion/art/Garland';

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
  // On Ramadan / Eid the journey's world takes the occasion's colours.
  const occasion = useOccasion();
  return (
    <View style={styles.root}>
      <ParallaxBackground progress={progress ?? 0} config={occasion?.journeyBackdrop ?? BACKDROP} />
      {occasion ? <Garland items={occasion.garland} size={22} sag={22} /> : null}
      <View style={styles.overlay}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas, overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFill },
});
