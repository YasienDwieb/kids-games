import { I18nManager, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SHADOWS, TOUCH_TARGET } from '../../constants';

type BackButtonProps = {
  onPress: () => void;
};

// Back chevron points toward the reading origin — left in LTR, right in RTL.
const BACK_GLYPH = I18nManager.isRTL ? '›' : '‹';

// Floating circular back control (top-left), used by bare-mode games and the
// game player. Sits just below the status bar (safe-area inset) so it lines up
// with the games' top bars. Surface circle with a chevron — design iconbtn.
export function BackButton({ onPress }: BackButtonProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  // Logical-start inset: in landscape a status/nav bar or notch eats the leading
  // edge, so offset by it. `start` is left in LTR, right in RTL.
  const startInset = I18nManager.isRTL ? insets.right : insets.left;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { top: insets.top + SPACING.xs, start: startInset + SPACING.md },
        SHADOWS.sm,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text}>{BACK_GLYPH}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    // `start` mirrors to the right edge under RTL (absolute `left` would not).
    start: SPACING.md,
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
