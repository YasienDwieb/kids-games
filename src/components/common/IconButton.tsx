import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { COLORS, FONTS, OUTLINE, SHADOWS, FONT_SIZES } from '../../constants';

type IconButtonProps = {
  glyph?: string;
  /** Custom content (e.g. an icon) instead of a text glyph. */
  children?: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  glyphSize?: number;
  /** Fill colour (default white surface). */
  color?: string;
  style?: ViewStyle;
  /** When true, ignores presses and dims the control. */
  disabled?: boolean;
};

// The canonical round control — back / sound / settings. An ink-outlined
// circle with a hard shadow; it drops onto the shadow while pressed.
export function IconButton({
  glyph,
  children,
  onPress,
  accessibilityLabel,
  size = 48,
  glyphSize = FONT_SIZES.md,
  color = COLORS.surface,
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
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        pressed ? styles.pressed : SHADOWS.sm,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children ?? (
        <Text style={[styles.glyph, { fontSize: glyphSize, lineHeight: glyphSize * 1.25 }]}>
          {glyph}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  disabled: { opacity: 0.5 },
  glyph: {
    fontFamily: FONTS.display,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
