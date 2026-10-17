/**
 * The round's side pane: the character's picture (word picture for letters,
 * `count` balloons for digits, from → to story for warm-ups), its word, and a
 * replay button that speaks it again.
 */
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { COLORS, EmojiImage, FONTS, Icon, IconButton, SPACING, useTranslation } from '@/sdk';
import type { TraceChar } from '../catalog';

type WordPaneProps = {
  char: TraceChar;
  /** Pane width; pictures scale to it. */
  width: number;
  onReplay: () => void;
};

/** What the pane names the character: the example word for letters, else its spoken name. */
export function wordFor(char: TraceChar, t: (key: string) => string): string {
  return char.word ? t('letters:words.' + char.word) : t(char.nameKey);
}

export function WordPane({ char, width, onReplay }: WordPaneProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Picture char={char} width={width} />
      <Text style={styles.word} numberOfLines={2}>
        {wordFor(char, t)}
      </Text>
      <IconButton onPress={onReplay} accessibilityLabel={t('trace-it:a11y.replay')} size={56}>
        <Icon name="volume-high" size={28} />
      </IconButton>
    </View>
  );
}

function Picture({ char, width }: { char: TraceChar; width: number }) {
  if (char.from && char.to) {
    const size = Math.min(88, width * 0.3);
    // Physical order (R5): the from-emoji sits on its stroke's start side and the
    // arrow points at the to-emoji. Icon mirrors arrows under RTL, so undo that.
    const fromLeft = char.fromSide !== 'right';
    const flip = fromLeft === I18nManager.isRTL;
    const ends = [
      <EmojiImage key="from" emoji={char.from} size={size} />,
      <View key="arrow" style={flip ? styles.flip : undefined}>
        <Icon name="arrow-forward" size={size * 0.45} />
      </View>,
      <EmojiImage key="to" emoji={char.to} size={size} />,
    ];
    return <View style={styles.story}>{fromLeft ? ends : ends.reverse()}</View>;
  }
  if (char.count !== undefined && char.emoji) {
    if (char.count === 0) return null;
    const size = Math.min(52, width / 4.5);
    return (
      <View style={[styles.balloons, { width: size * 3 + SPACING.xs * 2 }]}>
        {Array.from({ length: char.count }, (_, i) => (
          <EmojiImage key={i} emoji={char.emoji!} size={size} />
        ))}
      </View>
    );
  }
  if (char.emoji) return <EmojiImage emoji={char.emoji} size={Math.min(140, width * 0.6)} />;
  return null;
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  // Pinned LTR so `fromSide` stays a physical side under Arabic.
  story: { direction: 'ltr', flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  flip: { transform: [{ scaleX: -1 }] },
  balloons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.xs },
  word: { fontFamily: FONTS.display, fontSize: 32, color: COLORS.ink, textAlign: 'center' },
});
