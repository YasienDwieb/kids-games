import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HudPill, hudTextStyle, IconButton, SPACING, TOUCH_TARGET, useTranslation } from '@/sdk';
import { EMOJI } from '../constants';

interface HudProps {
  level: number;
  collected: number;
  total: number;
  onHint: () => void;
  /** When true, renders as a vertical side panel (landscape mode). */
  landscape?: boolean;
}

/** Top bar (portrait) or side panel (landscape): level · star tally · hint. */
export function Hud({ level, collected, total, onHint, landscape = false }: HudProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (landscape) {
    // Vertical side panel: items stacked, respects end-side safe-area inset.
    return (
      <View
        style={[styles.panel, { paddingEnd: insets.right + SPACING.sm, paddingTop: insets.top + SPACING.sm }]}
        pointerEvents="box-none"
      >
        <HudPill>
          <Text style={hudTextStyle}>{t('mouse-maze:hud.level', { level })}</Text>
        </HudPill>
        <HudPill>
          <Text style={styles.icon}>{EMOJI.star}</Text>
          {/* Pin tally to LTR so digits never bidi-reorder in Arabic */}
          <Text style={[hudTextStyle, styles.tally]}>
            {collected}/{total}
          </Text>
        </HudPill>
        <IconButton
          glyph="💡"
          onPress={onHint}
          accessibilityLabel={t('mouse-maze:hud.hintLabel')}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.bar, { paddingTop: insets.top + SPACING.xs }]}
      pointerEvents="box-none"
    >
      {/* reserves room for the floating BackButton so nothing overlaps it */}
      <View style={styles.backSpace} />

      <View style={styles.center}>
        <HudPill>
          <Text style={hudTextStyle}>{t('mouse-maze:hud.level', { level })}</Text>
        </HudPill>
      </View>

      <View style={styles.right}>
        <HudPill>
          <Text style={styles.icon}>{EMOJI.star}</Text>
          {/* Pin tally to LTR so digits never bidi-reorder in Arabic */}
          <Text style={[hudTextStyle, styles.tally]}>
            {collected}/{total}
          </Text>
        </HudPill>
        <IconButton
          glyph="💡"
          onPress={onHint}
          accessibilityLabel={t('mouse-maze:hud.hintLabel')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.recommended,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  // Landscape side panel: vertical stack, not absolutely positioned.
  panel: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.sm,
    minWidth: TOUCH_TARGET.recommended * 2,
  },
  backSpace: { width: TOUCH_TARGET.recommended },
  center: { flex: 1, alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  icon: { fontSize: 17 },
  // Pin the collected/total digits to LTR so they never reorder under Arabic bidi.
  tally: { direction: 'ltr' as const },
});
