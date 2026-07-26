import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  ACCENTS,
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  bestTextOn,
  type AccentName,
} from '../../constants';

const EDGE = 5; // depth of the solid bottom edge that compresses on press

// Mix a hex color toward black to derive the pressed/edge shade.
function darken(hex: string, amount = 0.18): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return hex;
  const f = 1 - amount;
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

type PressableButtonProps = {
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  accent?: AccentName;
  color?: string; // explicit base color (overrides accent); edge auto-darkened
  colorDeep?: string;
  variant?: 'solid' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  align?: 'center' | 'flex-start';
};

// Chunky, kid-friendly button with a solid bottom edge that compresses on
// press (design/tokens.css `.btn`). The face sits above a deeper edge color;
// pressing translates the face down to "sink" it into the socket.
export function PressableButton({
  label,
  children,
  onPress,
  accent,
  color,
  colorDeep,
  variant = 'solid',
  disabled = false,
  style,
  textStyle,
  align = 'center',
}: PressableButtonProps) {
  const translate = useRef(new Animated.Value(0)).current;

  const isGhost = variant === 'ghost';
  // Default fill is the purple accent, not COLORS.brand: brand (#8B7CF0) sits in
  // the contrast dead zone where neither ink (3.81:1) nor white (3.37:1) clears
  // AA. The purple accent is the same violet family and reads 4.62:1 with ink.
  const base = isGhost
    ? COLORS.surface
    : color ?? ACCENTS[accent ?? 'purple'].base;
  const deep = isGhost
    ? COLORS.line2
    : colorDeep ?? (color ? darken(color) : ACCENTS[accent ?? 'purple'].deep);
  // Label colour follows the fill so game-supplied colors stay legible.
  const labelColor = isGhost ? COLORS.ink : bestTextOn(base);

  const press = (to: number) =>
    Animated.spring(translate, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => !disabled && press(EDGE)}
      onPressOut={() => press(0)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.socket,
        SHADOWS.sm,
        { backgroundColor: deep, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.face,
          { backgroundColor: base, justifyContent: align === 'center' ? 'center' : 'flex-start' },
          { transform: [{ translateY: translate }] },
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
    borderRadius: BORDER_RADIUS.btn,
    paddingBottom: EDGE,
  },
  face: {
    borderRadius: BORDER_RADIUS.btn,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 22,
    gap: 10,
  },
  label: {
    fontFamily: FONTS.display,
    fontSize: 19,
    textAlign: 'center',
  },
});
