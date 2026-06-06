import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS, TOUCH_TARGET } from '../../constants';

type BackButtonProps = {
  onPress: () => void;
};

// Floating circular back control (top-left), used by bare-mode games and the
// game player. Sits just below the status bar (safe-area inset) so it lines up
// with the games' top bars. Surface circle with a chevron — design iconbtn.
export function BackButton({ onPress }: BackButtonProps) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { top: insets.top + SPACING.xs },
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
