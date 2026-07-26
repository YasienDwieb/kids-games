import { Pressable, StyleSheet, Text } from 'react-native';
import { ACCENTS, COLORS, FONTS, SHADOWS, BORDER_RADIUS } from '../../constants';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

// Pill category filter. Mirrors `.chip` / `.chip--on` from design/tokens.css.
export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, SHADOWS.sm, active && styles.chipActive]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    // Same reasoning as PressableButton: COLORS.brand cannot carry legible text
    // in either direction, the purple accent reads 4.62:1 with ink.
    backgroundColor: ACCENTS.purple.base,
    shadowColor: COLORS.brandDeep,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
  },
  textActive: { color: COLORS.ink },
});
