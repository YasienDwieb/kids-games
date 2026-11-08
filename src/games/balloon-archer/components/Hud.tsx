import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, EmojiImage, HudPill, OUTLINE, SPACING, TOUCH_TARGET } from '@/sdk';

type Props = { popped: number; quota: number; arrowsLeft: number };

/** Top bar: a balloon per balloon to pop, filling up, and the arrows left in the quiver. */
export function Hud({ popped, quota, arrowsLeft }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + SPACING.xs }]} pointerEvents="box-none">
      <View style={styles.backSpace} />

      <View style={styles.center}>
        <HudPill accessibilityLabel={`${popped}/${quota}`}>
          {Array.from({ length: quota }, (_, i) => (
            <View key={i} style={i < popped ? null : styles.faint}>
              <EmojiImage emoji="🎈" size={20} />
            </View>
          ))}
        </HudPill>
      </View>

      <HudPill accessibilityLabel={`🏹 ${arrowsLeft}`}>
        <EmojiImage emoji="🏹" size={20} />
        <View style={styles.quiver}>
          {Array.from({ length: arrowsLeft }, (_, i) => (
            <View key={i} style={styles.arrow} />
          ))}
        </View>
      </HudPill>
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
  faint: { opacity: 0.25 },
  quiver: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  arrow: {
    width: 5,
    height: 20,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
  },
});
