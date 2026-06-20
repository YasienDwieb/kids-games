import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants';
import type { Actor } from './actors';
import { ActorLayer } from './ActorLayer';

export function SceneCanvas({
  actors = [],
  children,
}: {
  /** Optional shared sprites for opt-in actor morphs; omit for component units. */
  actors?: Actor[];
  children?: ReactNode;
}) {
  return (
    <View style={styles.root}>
      {/* Oversized backdrop, persistent across units, so the world feels continuous. */}
      <View style={styles.backdrop} pointerEvents="none" />
      {actors.length > 0 ? <ActorLayer actors={actors} /> : null}
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
