import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants';
import type { Actor } from './actors';
import { ActorLayer } from './ActorLayer';

export function SceneCanvas({ actors, children }: { actors: Actor[]; children?: ReactNode }) {
  return (
    <View style={styles.root}>
      {/* Oversized backdrop so actors can enter/exit frame during morphs. */}
      <View style={styles.backdrop} pointerEvents="none" />
      <ActorLayer actors={actors} />
      {/* Unit interaction overlay (Pressables positioned at actor coords). */}
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
