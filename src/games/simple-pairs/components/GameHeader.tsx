import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HudPill, hudTextStyle, IconButton } from '../../../components/common';
import { SPACING, TOUCH_TARGET } from '../../../constants';
import { useTranslation } from '@/sdk';

type GameHeaderProps = {
  found: number;
  total: number;
  moves: number;
  onReset: () => void;
};

export function GameHeader({ found, total, moves, onReset }: GameHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const movesKey = moves === 1 ? 'header.movesOne' : 'header.movesOther';

  if (landscape) {
    // Compact single-row layout: hud pills + reset button side by side.
    // Leading spacer reserves room for the floating BackButton (64px + SPACING.md gap).
    return (
      <View
        style={[
          styles.wrapLandscape,
          { paddingTop: insets.top + SPACING.xs, paddingStart: insets.left + SPACING.md },
        ]}
      >
        <View style={styles.backButtonSpacer} />
        <HudPill>
          <Text style={styles.icon}>🃏</Text>
          <Text style={hudTextStyle}>
            {t('simple-pairs:header.pairs', { found, total })}
          </Text>
        </HudPill>
        <HudPill>
          <Text style={styles.icon}>👆</Text>
          <Text style={hudTextStyle}>
            {t(`simple-pairs:${movesKey}`, { count: moves })}
          </Text>
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
        <HudPill>
          <Text style={styles.icon}>🃏</Text>
          <Text style={hudTextStyle}>
            {t('simple-pairs:header.pairs', { found, total })}
          </Text>
        </HudPill>
        <HudPill>
          <Text style={styles.icon}>👆</Text>
          <Text style={hudTextStyle}>
            {t(`simple-pairs:${movesKey}`, { count: moves })}
          </Text>
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
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  // 64px (recommended touch target) + gap; ensures the floating BackButton doesn't overlap the first pill.
  backButtonSpacer: { width: TOUCH_TARGET.recommended },
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
  icon: { fontSize: 17 },
});
