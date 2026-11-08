import React from 'react';
import { I18nManager, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HudPill, IconButton, Star } from '../../../components/common';
import { SPACING, TOUCH_TARGET } from '../../../constants';
import { useTranslation } from '@/sdk';

type GameHeaderProps = {
  found: number;
  total: number;
  onReset: () => void;
};

export function GameHeader({ found, total, onReset }: GameHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  if (landscape) {
    // Compact single row pinned to the end edge (like the other games' HUDs),
    // leaving the start corner to the floating BackButton.
    const endInset = I18nManager.isRTL ? insets.left : insets.right;
    return (
      <View
        style={[
          styles.wrapLandscape,
          { paddingTop: insets.top + SPACING.xs, paddingEnd: endInset + SPACING.md },
        ]}
      >
        <HudPill accessibilityLabel={t('simple-pairs:header.pairs', { found, total })}>
          {Array.from({ length: total }, (_, i) => (
            <Star key={i} size={16} filled={i < found} />
          ))}
        </HudPill>
        <IconButton
          glyph="↻"
          onPress={onReset}
          accessibilityLabel={t('simple-pairs:header.restart')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + SPACING.xs }]}>
      <View style={styles.topRow}>
        <IconButton
          glyph="↻"
          onPress={onReset}
          accessibilityLabel={t('simple-pairs:header.restart')}
        />
      </View>

      <View style={styles.hudRow}>
        <HudPill accessibilityLabel={t('simple-pairs:header.pairs', { found, total })}>
          {Array.from({ length: total }, (_, i) => (
            <Star key={i} size={16} filled={i < found} />
          ))}
        </HudPill>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.md,
  },
  wrapLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    minHeight: TOUCH_TARGET.recommended,
    paddingBottom: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.recommended,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingTop: SPACING.sm,
  },
});
