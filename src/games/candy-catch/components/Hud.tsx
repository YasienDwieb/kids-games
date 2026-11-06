import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HudPill, ProgressBar, SPACING, TOUCH_TARGET } from '@/sdk';

interface HudProps {
  score: number;
  target: number;
  lives: number;
}

const MAX_LIVES = 3;

/** Top HUD: a bar filling toward the target (center) · hearts (right). */
export function Hud({ score, target, lives }: HudProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.bar, { paddingTop: insets.top + SPACING.xs }]}
      pointerEvents="box-none"
    >
      {/* reserve room for the floating BackButton */}
      <View style={styles.backSpace} />

      <View style={styles.center}>
        <ProgressBar value={score / target} style={styles.progress} />
      </View>

      <View style={styles.right}>
        <HudPill>
          <Text style={styles.hearts}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (i < lives ? '❤️' : '🤍')).join(' ')}
          </Text>
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
    zIndex: 5,
  },
  backSpace: { width: TOUCH_TARGET.recommended },
  center: { flex: 1, alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  hearts: { fontSize: 15 },
  progress: { width: '70%' },
});
