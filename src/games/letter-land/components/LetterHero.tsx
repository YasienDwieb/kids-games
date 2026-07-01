/**
 * LetterHero — the word-picture hero for a letter round (e.g. 🍎 for A).
 *
 * Rendered inside ListenFindBoard's tappable hero surface; tapping replays the
 * spoken prompt (the board owns the press + speaker badge).
 */

import { StyleSheet, View } from 'react-native';
import { EmojiImage } from '@/components/common';
import type { Letter } from '../types';

export function LetterHero({ letter }: { letter: Letter }): React.JSX.Element {
  return (
    <View style={styles.root}>
      <EmojiImage emoji={letter.emoji} size={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});
