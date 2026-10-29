import { StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { COLORS } from '../constants';
import { recipeCounts } from '../utils';
import type { PigmentId } from '../types';

type RecipeRowProps = {
  recipe: readonly PigmentId[];
  /** Blob diameter. */
  size?: number;
};

/**
 * A recipe as pictures — 🔴 + 🟡🟡 — so a child who can't read still sees what goes in.
 * Used under the pot (what's in it so far) and as the challenge hint.
 */
export function RecipeRow({ recipe, size = 20 }: RecipeRowProps) {
  const groups = recipeCounts(recipe);
  if (groups.length === 0) return null;
  const font = Math.round(size * 0.8);
  return (
    <View style={styles.row} accessible={false}>
      {groups.map(([pigment, n], i) => (
        <View key={pigment} style={styles.group}>
          {i > 0 ? <Text style={[styles.plus, { fontSize: font }]}>+</Text> : null}
          <ColorBlob color={COLORS[pigment].hex} size={size} showShine />
          {n > 1 ? <Text style={[styles.count, { fontSize: Math.round(font * 0.8) }]}>×{n}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pinned LTR: "×2" belongs right after its blob in both languages.
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', direction: 'ltr' },
  group: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  plus: { fontFamily: FONTS.displayBold, color: TOKENS.inkSoft, marginHorizontal: 5 },
  count: { fontFamily: FONTS.bodyExtra, color: TOKENS.inkSoft },
});
