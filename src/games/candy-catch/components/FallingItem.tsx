import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS } from '@/sdk';
import { ITEM_SIZE, type ItemKind } from '../constants';

interface FallingItemProps {
  emoji: string;
  kind: ItemKind;
}

/** Glossy rounded tile (candy) with an emoji on it. */
export function FallingItem({ emoji, kind }: FallingItemProps) {
  return (
    <View
      style={[
        styles.tile,
        kind === 'gold' && styles.gold,
        (kind === 'bad' || kind === 'bomb') && styles.bad,
      ]}
    >
      <View style={styles.highlight} />
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 2.5,
    borderColor: 'rgba(59,48,38,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  highlight: {
    position: 'absolute',
    left: 8,
    top: 6,
    width: 22,
    height: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  emoji: { fontSize: 30 },
  gold: {
    backgroundColor: COLORS.gold,
    borderColor: '#E0A93C',
  },
  bad: {
    backgroundColor: '#FFF4F2',
    borderColor: 'rgba(224,96,79,0.35)',
  },
});
