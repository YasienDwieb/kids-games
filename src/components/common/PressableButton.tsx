import { useRef, type ReactNode } from 'react';
import {
  Animated,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  ACCENTS,
  COLORS,
  FONTS,
  BORDER_RADIUS,
  OUTLINE,
  bestTextOn,
  type AccentName,
} from '../../constants';

const DROP = 4; // offset of the hard ink shadow the face presses down onto

type PressableButtonProps = {
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  accent?: AccentName;
  color?: string; // explicit fill (overrides accent)
  /** @deprecated The edge is always ink now; kept so existing call sites compile. */
  colorDeep?: string;
  variant?: 'solid' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  align?: 'center' | 'flex-start';
  accessibilityLabel?: string;
};

// Pop Quest CTA: a loud fill wearing an ink outline and a hard ink shadow.
// Pressing drops the face onto its shadow, so the button visibly "clicks".
export function PressableButton({
  label,
  children,
  onPress,
  accent,
  color,
  variant = 'solid',
  disabled = false,
  style,
  textStyle,
  align = 'center',
  accessibilityLabel,
}: PressableButtonProps) {
  const sink = useRef(new Animated.Value(0)).current;

  const isGhost = variant === 'ghost';
  const base = isGhost ? COLORS.surface : color ?? ACCENTS[accent ?? 'green'].base;
  // Label colour follows the fill so game-supplied colors stay legible.
  const labelColor = isGhost ? COLORS.ink : bestTextOn(base);
  // The shadow sits toward the reading end; the face follows it when pressed.
  const dropX = I18nManager.isRTL ? -DROP : DROP;

  const press = (to: number) =>
    Animated.spring(sink, {
      toValue: to,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => !disabled && press(1)}
      onPressOut={() => press(0)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[styles.socket, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={styles.shadow} />
      <Animated.View
        style={[
          styles.face,
          { backgroundColor: base, justifyContent: align === 'center' ? 'center' : 'flex-start' },
          {
            transform: [
              { translateX: sink.interpolate({ inputRange: [0, 1], outputRange: [0, dropX] }) },
              { translateY: sink.interpolate({ inputRange: [0, 1], outputRange: [0, DROP] }) },
            ],
          },
        ]}
      >
        {children ?? (
          <Text style={[styles.label, { color: labelColor }, textStyle]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  socket: {
    paddingEnd: DROP,
    paddingBottom: DROP,
  },
  shadow: {
    position: 'absolute',
    top: DROP,
    start: DROP,
    end: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.btn,
    backgroundColor: OUTLINE.color,
  },
  face: {
    borderRadius: BORDER_RADIUS.btn,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 22,
    gap: 10,
  },
  // Pinned line box: Arabic display glyphs carry a much taller font box than
  // Latin, which would otherwise make every Arabic button half again as tall.
  label: {
    fontFamily: FONTS.display,
    fontSize: 21,
    lineHeight: 28,
    includeFontPadding: false,
    textAlign: 'center',
    // Android rounds custom-font text widths down and wraps the last word
    // ("Tap to" / "start"); a hair of padding absorbs the rounding.
    paddingHorizontal: 2,
  },
});
