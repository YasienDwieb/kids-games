import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '@/sdk';
import { EMOJI } from '../constants';

interface WinOverlayProps {
  collected: number;
  total: number;
  onNext: () => void;
}

/** Full-screen celebration shown when the mouse reaches its cheese. */
export function WinOverlay({ collected, total, onNext }: WinOverlayProps) {
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.burst}>🎉 {EMOJI.goal} 🎉</Text>
        <Text style={styles.title}>You made it!</Text>
        <Text style={styles.stars}>
          {EMOJI.star} {collected}/{total} stars
        </Text>
        <Pressable
          onPress={onNext}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Next maze →</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  burst: { fontSize: FONT_SIZES.xl },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text.primary },
  stars: { fontSize: FONT_SIZES.md, color: COLORS.text.secondary },
  button: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary.green,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.text.inverse },
  pressed: { opacity: 0.7 },
});
