import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HudPill, hudTextStyle, IconButton, SPACING, TOUCH_TARGET } from '@/sdk';
import { EMOJI } from '../constants';

interface HudProps {
  level: number;
  collected: number;
  total: number;
  onHint: () => void;
}

/** Top bar: back-space · level (centred) · star tally + hint, on one row. */
export function Hud({ level, collected, total, onHint }: HudProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.bar, { paddingTop: insets.top + SPACING.xs }]}
      pointerEvents="box-none"
    >
      {/* reserves room for the floating BackButton so nothing overlaps it */}
      <View style={styles.backSpace} />

      <View style={styles.center}>
        <HudPill>
          <Text style={hudTextStyle}>Level {level}</Text>
        </HudPill>
      </View>

      <View style={styles.right}>
        <HudPill>
          <Text style={styles.icon}>{EMOJI.star}</Text>
          <Text style={hudTextStyle}>
            {collected}/{total}
          </Text>
        </HudPill>
        <IconButton glyph="💡" onPress={onHint} accessibilityLabel="Show hint" />
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
  backSpace: { width: TOUCH_TARGET.recommended },
  center: { flex: 1, alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  icon: { fontSize: 17 },
});
