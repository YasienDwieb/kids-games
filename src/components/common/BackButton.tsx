import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, SPACING, SHADOWS, TOUCH_TARGET } from '../../constants';

type BackButtonProps = {
  onPress: () => void;
};

// Floating circular back control (top-left), used by bare-mode games and the
// game player. Surface circle with a chevron — matches the design iconbtn.
export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        SHADOWS.sm,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: SPACING.xxl,
    left: SPACING.md,
    zIndex: 10,
    width: TOUCH_TARGET.recommended,
    height: TOUCH_TARGET.recommended,
    borderRadius: TOUCH_TARGET.recommended / 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.92 }] },
  text: {
    fontSize: 34,
    lineHeight: 38,
    color: COLORS.ink,
    fontWeight: '600',
    marginTop: -4,
  },
});
