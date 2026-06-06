import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HudPill, hudTextStyle, SPACING, TOUCH_TARGET } from '@/sdk';

type Props = { level: number; popped: number; quota: number; arrowsLeft: number };

// Top bar: back-space · level (centered) · balloons popped + arrows left.
export function Hud({ level, popped, quota, arrowsLeft }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + SPACING.xs }]} pointerEvents="box-none">
      <View style={styles.backSpace} />

      <View style={styles.center}>
        <HudPill>
          <Text style={hudTextStyle}>Level {level}</Text>
        </HudPill>
      </View>

      <View style={styles.right}>
        <HudPill>
          <Text style={styles.icon}>🎈</Text>
          <Text style={hudTextStyle}>
            {popped}/{quota}
          </Text>
        </HudPill>
        <HudPill>
          <Text style={styles.icon}>🏹</Text>
          <Text style={hudTextStyle}>{arrowsLeft}</Text>
        </HudPill>
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
