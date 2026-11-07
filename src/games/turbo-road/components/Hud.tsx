import { StyleSheet, View } from 'react-native';
import { EmojiImage, HudPill, IconButton, SPACING, TOUCH_TARGET, useTranslation } from '@/sdk';
import { PLACE_MEDAL } from '../constants';
import type { HudProps } from '../types';

// Top HUD row: room for the SDK BackButton · your place as a medal · power-ups while they last · pause.
// Not absolutely positioned — the parent places it inside the safe area.
export function Hud({ place, shieldActive, magnetActive, onPause }: HudProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.bar} pointerEvents="box-none">
      <View style={styles.backSpace} />
      <View style={styles.center} pointerEvents="none">
        <HudPill accessibilityLabel={t(`turbo-road:place.p${place}`)}>
          <EmojiImage emoji={PLACE_MEDAL[place]} size={30} />
        </HudPill>
        {shieldActive || magnetActive ? (
          <HudPill>
            {shieldActive ? <EmojiImage emoji="🛡️" size={22} /> : null}
            {magnetActive ? <EmojiImage emoji="🧲" size={22} /> : null}
          </HudPill>
        ) : null}
      </View>
      <IconButton glyph="⏸" onPress={onPause} accessibilityLabel={t('turbo-road:a11y.pause')} />
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
  center: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm },
});
