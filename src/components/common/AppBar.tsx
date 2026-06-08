import { type ReactNode } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../../constants';
import { IconButton } from './IconButton';

// Back chevron points toward the reading origin — left in LTR, right in RTL.
const BACK_GLYPH = I18nManager.isRTL ? '›' : '‹';

type AppBarProps = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  left?: ReactNode;
};

// Unified header: back · centered title · action slot. Mirrors design AppBar.
export function AppBar({ title, onBack, right, left }: AppBarProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {left !== undefined ? (
          left
        ) : onBack ? (
          <IconButton
            glyph={BACK_GLYPH}
            glyphSize={32}
            onPress={onBack}
            accessibilityLabel={t('common.back')}
          />
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  side: {
    width: 48,
    height: 48,
    justifyContent: 'center',
  },
  right: { alignItems: 'flex-end' },
  title: {
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
