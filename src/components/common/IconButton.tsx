import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { COLORS, SHADOWS, FONT_SIZES } from '../../constants';

type IconButtonProps = {
  glyph: string;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  glyphSize?: number;
  style?: ViewStyle;
  /** When true, ignores presses and dims the control. */
  disabled?: boolean;
};

// The canonical circular surface control — back / restart / action.
// Mirrors `.iconbtn` from design/tokens.css.
export function IconButton({
  glyph,
  onPress,
  accessibilityLabel,
  size = 48,
  glyphSize = FONT_SIZES.md,
  style,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        SHADOWS.sm,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.glyph, { fontSize: glyphSize, lineHeight: glyphSize + 2 }]}>
        {glyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.92 }] },
  disabled: { opacity: 0.5 },
  glyph: {
    color: COLORS.ink,
    fontWeight: '600',
  },
});
