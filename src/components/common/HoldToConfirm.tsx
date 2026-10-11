import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { ACCENTS, COLORS, FONTS, BORDER_RADIUS, OUTLINE, type AccentName } from '../../constants';

type HoldToConfirmProps = {
  label: string;
  onConfirm: () => void;
  duration?: number; // ms the child must hold
  accent?: AccentName;
  style?: ViewStyle;
};

// Press-and-hold button: a gauge fills over `duration`; completing the hold
// fires onConfirm. Releasing early cancels and drains the gauge. Accident-proof
// alternative to a plain destructive button. The setTimeout governs confirm;
// the Animated fill is cosmetic.
export function HoldToConfirm({
  label,
  onConfirm,
  duration = 1200,
  accent = 'coral',
  style,
}: HoldToConfirmProps) {
  const fill = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const family = ACCENTS[accent];

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    Animated.timing(fill, { toValue: 1, duration, useNativeDriver: false }).start();
    timer.current = setTimeout(() => {
      fill.setValue(0);
      onConfirm();
    }, duration);
  };

  const cancel = () => {
    clearTimeout(timer.current);
    Animated.timing(fill, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.btn, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.fillBar, { width, backgroundColor: family.base }]}
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  fillBar: { position: 'absolute', start: 0, top: 0, bottom: 0 },
  label: { fontFamily: FONTS.display, fontSize: 17, color: COLORS.ink },
});
