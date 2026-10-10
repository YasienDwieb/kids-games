import { I18nManager, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, OUTLINE, SPACING, SHADOWS } from '../../constants';
import { Icon } from './Icon';

type BackButtonProps = {
  onPress: () => void;
};

const SIZE = 56;

// Floating round back control (top-start), used by bare-mode games and the
// game player. Sits just below the status bar (safe-area inset) so it lines up
// with the games' top bars. The chevron points toward the reading origin.
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
        pressed ? styles.pressed : SHADOWS.md,
      ]}
    >
      <Icon name="chevron-back" size={30} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    // `start` mirrors to the right edge under RTL (absolute `left` would not).
    start: SPACING.md,
    zIndex: 10,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
});
