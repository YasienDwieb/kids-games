import { StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  FONTS,
  HudPill,
  hudTextStyle,
  IconButton,
  SPACING,
  TOUCH_TARGET,
  useTranslation,
} from '@/sdk';
import type { HudProps } from '../types';

// Top HUD row: level pill · centered place badge (+ power-up chips) · coin
// pill · pause button. The leading spacer keeps the top-left (top-start)
// corner clear for the SDK's absolute BackButton (bare-mode games get one at
// start: SPACING.md, 64px wide). Not absolutely positioned — the parent
// places it inside the safe area.
export function Hud({ level, place, coins, shieldActive, magnetActive, onPause }: HudProps) {
  const { t } = useTranslation();
  const placeLabel =
    place === 1
      ? t('turbo-road:place.p1')
      : place === 2
        ? t('turbo-road:place.p2')
        : t('turbo-road:place.p3');

  return (
    <View style={styles.bar} pointerEvents="box-none">
      <View style={styles.backSpace} />

      <HudPill>
        <Text style={styles.icon}>🏁</Text>
        <Text style={hudTextStyle}>{t('turbo-road:hud.level', { n: level })}</Text>
      </HudPill>

      <View style={styles.center} pointerEvents="none">
        <HudPill style={styles.placeBadge}>
          <Text style={styles.placeText}>{placeLabel}</Text>
        </HudPill>
        {(shieldActive || magnetActive) && (
          <View style={styles.powerRow}>
            {shieldActive && <Text style={styles.powerIcon}>🛡️</Text>}
            {magnetActive && <Text style={styles.powerIcon}>🧲</Text>}
          </View>
        )}
      </View>

      <View accessibilityLabel={t('turbo-road:a11y.coins')}>
        <HudPill>
          <Text style={styles.icon}>🪙</Text>
          <Text style={hudTextStyle}>{coins}</Text>
        </HudPill>
      </View>

      <IconButton
        glyph="⏸"
        onPress={onPause}
        accessibilityLabel={t('turbo-road:a11y.pause')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.recommended,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  // Room for the SDK BackButton (absolute, start: SPACING.md, 64px circle).
  backSpace: { width: TOUCH_TARGET.recommended },
  center: { flex: 1, alignItems: 'center', gap: SPACING.xs },
  powerRow: { flexDirection: 'row', gap: SPACING.xs },
  powerIcon: { fontSize: 18 },
  placeBadge: { paddingHorizontal: 20 },
  placeText: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.ink,
  },
  icon: { fontSize: 17 },
});
