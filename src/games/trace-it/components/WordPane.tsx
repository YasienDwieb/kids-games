/**
 * The round's side pane: the character's picture (word picture for letters,
 * `count` balloons for digits; warm-ups tell their story on the board), its
 * word, and a replay button that speaks it again.
 */
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, EmojiImage, FONTS, Icon, IconButton, SPACING, fontsFor, useTranslation } from '@/sdk';
import { charLanguage, type TraceChar } from '../catalog';

type WordPaneProps = {
  char: TraceChar;
  /** Pane width; pictures scale to it. */
  width: number;
  onReplay: () => void;
};

/** What the pane names the character, in its own language: the example word for letters, else its spoken name. */
export function wordFor(char: TraceChar, t: (key: string, options?: { lng: string }) => string): string {
  const lng = charLanguage(char);
  return char.word ? t('letters:words.' + char.word, { lng }) : t(char.nameKey, { lng });
}

export function WordPane({ char, width, onReplay }: WordPaneProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Picture char={char} width={width} />
      <Text style={[styles.word, { fontFamily: fontsFor(charLanguage(char)).display }]} numberOfLines={2}>
        {wordFor(char, t)}
      </Text>
      <IconButton onPress={onReplay} accessibilityLabel={t('trace-it:a11y.replay')} size={56}>
        <Icon name="volume-high" size={28} />
      </IconButton>
    </View>
  );
}

function Picture({ char, width }: { char: TraceChar; width: number }) {
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
  balloons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.xs },
  word: { fontFamily: FONTS.display, fontSize: 32, color: COLORS.ink, textAlign: 'center' },
});
