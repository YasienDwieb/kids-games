import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HudPill, hudTextStyle, IconButton, SPACING } from '@/sdk';
import { EMOJI } from '../constants';

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
      <HudPill>
        <Text style={hudTextStyle}>Level {level}</Text>
      </HudPill>

      <View style={styles.right}>
        <HudPill>
          <Text style={styles.icon}>{EMOJI.star}</Text>
          <Text style={hudTextStyle}>
            {collected}/{total}
          </Text>
        </HudPill>
        <IconButton glyph="💡" onPress={onHint} accessibilityLabel="Show hint" />
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
  icon: { fontSize: 17 },
});
