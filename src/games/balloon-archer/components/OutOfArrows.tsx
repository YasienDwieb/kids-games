import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS, Mascot, OUTLINE, SHADOWS } from '@/sdk';

/** The short breather after the quiver runs dry; the level restarts by itself. */
export function OutOfArrows() {
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);
  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Animated.View style={[styles.card, SHADOWS.lg, { transform: [{ scale }] }]}>
        <Mascot pose="encourage" size={120} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlay,
    zIndex: 20,
  },
  card: {
    padding: 20,
    borderRadius: BORDER_RADIUS.tile,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
});
