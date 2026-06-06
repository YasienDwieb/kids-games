import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, FONT_SIZES, SPACING } from '@/sdk';
import { EMOJI, MAZE_COLORS } from '../constants';

interface HudProps {
  level: number;
  collected: number;
  total: number;
  onHint: () => void;
}

/** Top overlay: level label (centred), star tally + hint button (right). */
export function Hud({ level, collected, total, onHint }: HudProps) {
  return (
    <SafeAreaView style={styles.bar} edges={['top']} pointerEvents="box-none">
      <View style={styles.pill}>
        <Text style={styles.levelText}>Level {level}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.pill}>
          <Text style={styles.starText}>
            {EMOJI.star} {collected}/{total}
          </Text>
        </View>
        <Pressable
          onPress={onHint}
          style={({ pressed }) => [styles.hintBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.hintText}>💡</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  right: {
    position: 'absolute',
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pill: {
    backgroundColor: MAZE_COLORS.hud,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  levelText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: MAZE_COLORS.text },
  starText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: MAZE_COLORS.text },
  hintBtn: {
    backgroundColor: MAZE_COLORS.hud,
    borderRadius: BORDER_RADIUS.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: { fontSize: 22 },
  pressed: { opacity: 0.6 },
});
