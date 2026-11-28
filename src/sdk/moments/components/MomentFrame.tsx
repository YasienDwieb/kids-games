import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/Icon';
import { PressableButton } from '@/components/common/PressableButton';
import { ACCENTS, COLORS } from '@/constants/colors';
import { BORDER_RADIUS, OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';

/**
 * The shared layout of a listen-style moment: the illustration in an outlined
 * card, optional content under it, and the big check button once `ready`.
 */
export function MomentFrame({
  image,
  children,
  ready,
  onDone,
  size,
}: {
  image: number;
  children?: ReactNode;
  ready: boolean;
  onDone: () => void;
  size: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <View style={[styles.card, SHADOWS.md]}>
        <Image source={image} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
      {children}
      <View style={styles.action}>
        {ready ? (
          <PressableButton accessibilityLabel={t('moments.done')} color={ACCENTS.green.base} onPress={onDone}>
            <Icon name="checkmark" size={36} />
          </PressableButton>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  // Reserve the button's room so the picture doesn't jump when it appears.
  action: { minHeight: 80, justifyContent: 'center' },
});
