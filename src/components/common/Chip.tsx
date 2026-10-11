import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS, OUTLINE, SHADOWS, BORDER_RADIUS, POP } from '../../constants';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

// Pill filter / tab. Inactive: white with a hard shadow. Active: solid ink with
// zap-yellow text, pressed flat (no shadow) so the selection reads as "down".
export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : SHADOWS.sm,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.ink },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  text: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: COLORS.ink,
  },
  textActive: { color: POP.zap },
});
