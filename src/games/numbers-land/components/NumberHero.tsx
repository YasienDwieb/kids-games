/**
 * NumberHero — the count-cluster hero for a number round (e.g. 3× ⭐ for 3).
 *
 * Audio-first sibling to Letter Land: the child hears the number name and the
 * cluster reinforces the quantity. Rendered inside ListenFindBoard's tappable
 * hero surface (the board owns the press + speaker badge).
 */

import { StyleSheet, View } from 'react-native';
import { SPACING } from '@/sdk';
import { EmojiImage } from '@/components/common';
import type { NumberItem } from '../types';

export function NumberHero({ item }: { item: NumberItem }): React.JSX.Element {
  // Shrink the objects a little once there are many, so the cluster stays inside
  // the hero surface (width-based, no per-device pixel budgets).
  const size = item.count > 6 ? 34 : item.count > 3 ? 44 : 56;
  return (
    <View style={styles.root}>
      {Array.from({ length: item.count }, (_, i) => (
        <EmojiImage key={i} emoji={item.emoji} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 200,
  },
});
