import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS, OUTLINE, SHADOWS, BORDER_RADIUS, POP } from '../../constants';
import { EmojiImage } from './EmojiImage';
import { Icon, type IconName } from './Icon';

type ChipProps = {
  /** Visible text, or the screen-reader label when `icon`/`emoji` is set. */
  label: string;
  /** Show a picture instead of `label`, for screens a pre-reader uses. */
  icon?: IconName;
  emoji?: string;
  active?: boolean;
  onPress: () => void;
  /** Overrides the UI font, for a label in another script (e.g. Arabic letters in an English UI). */
  fontFamily?: string;
};

// Pill filter / tab. Inactive: white with a hard shadow. Active: solid ink with
// zap-yellow text, pressed flat (no shadow) so the selection reads as "down".
export function Chip({ label, icon, emoji, active = false, onPress, fontFamily }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : SHADOWS.sm,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={26} color={active ? POP.zap : COLORS.ink} />
      ) : emoji ? (
        <EmojiImage emoji={emoji} size={28} />
      ) : (
        <Text numberOfLines={1} style={[styles.text, active && styles.textActive, fontFamily ? { fontFamily } : null]}>{label}</Text>
      )}
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
