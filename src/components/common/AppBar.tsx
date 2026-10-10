import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../../constants';
import { IconButton } from './IconButton';
import { Icon } from './Icon';

type AppBarProps = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  left?: ReactNode;
  /** Title colour — white on loud full-bleed screens. */
  titleColor?: string;
};

// Header: round back button · big start-aligned title · action slot.
export function AppBar({ title, onBack, right, left, titleColor = COLORS.ink }: AppBarProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.bar}>
      {left !== undefined ? (
        left
      ) : onBack ? (
        <IconButton onPress={onBack} accessibilityLabel={t('common.back')}>
          <Icon name="chevron-back" size={26} />
        </IconButton>
      ) : null}
      <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      {right != null ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: {
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 28,
    textAlign: 'left',
  },
});
