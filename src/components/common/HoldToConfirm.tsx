import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { ACCENTS, COLORS, FONTS, BORDER_RADIUS, type AccentName } from '../../constants';

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
  const [holding, setHolding] = useState(false);
  const family = ACCENTS[accent];

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    setHolding(true);
    Animated.timing(fill, { toValue: 1, duration, useNativeDriver: false }).start();
    timer.current = setTimeout(() => {
      setHolding(false);
      fill.setValue(0);
      onConfirm();
    }, duration);
  };

  const cancel = () => {
    clearTimeout(timer.current);
    setHolding(false);
    Animated.timing(fill, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPressIn={start} onPressOut={cancel} style={[styles.btn, style]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.fillBar, { width, backgroundColor: family.tint }]}
      />
      <Text style={[styles.label, holding && { color: family.deep }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  fillBar: { position: 'absolute', start: 0, top: 0, bottom: 0 },
  label: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.inkSoft },
});
