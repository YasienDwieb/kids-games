// Small shared pieces for the School screens: badge dots, star rows, and the
// tile that draws a round's Visual (a letter, a picture, a group, a colour).
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { EmojiImage, Star } from '../../components/common';
import { ACCENTS, COLORS, FONTS, OUTLINE, fontForText } from '../../constants';
import type { Badge, Visual } from '../../school';

const BADGE_FILL: Record<Badge, string> = {
  bronze: '#E9A65A',
  silver: '#C9CDD8',
  gold: COLORS.gold,
};

export function BadgeDot({ badge, size = 44, earned = true }: { badge: Badge; size?: number; earned?: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2 },
        earned ? { backgroundColor: BADGE_FILL[badge] } : styles.badgeEmpty,
      ]}
    >
      {earned ? <Star size={size * 0.48} style={styles.badgeStar} /> : null}
    </View>
  );
}

export function StarRow({ n, size = 18, style }: { n: number; size?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.stars, style]}>
      {[1, 2, 3].map((i) => (
        <Star key={i} size={size} filled={i <= n} />
      ))}
    </View>
  );
}

/** Draws a Visual sized to `size` (the tile's inner box). */
export function VisualArt({ visual, size, textStyle }: { visual: Visual; size: number; textStyle?: TextStyle }) {
  switch (visual.kind) {
    case 'text': {
      // Long words (day names) shrink; single letters and numerals stay big.
      const len = [...visual.text].length;
      const fontSize = len <= 2 ? size * 0.62 : Math.max(14, (size * 1.5) / len);
      return (
        <Text
          style={[styles.text, { fontSize, lineHeight: fontSize * 1.35, fontFamily: fontForText(visual.text) }, textStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {visual.text}
        </Text>
      );
    }
    case 'emoji':
      return <EmojiImage emoji={visual.emoji} size={size * 0.7} />;
    case 'swatch':
      return <View style={[styles.swatch, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.2, backgroundColor: visual.color }]} />;
    case 'group': {
      const per = visual.n <= 3 ? visual.n : visual.n <= 6 ? 3 : visual.n <= 8 ? 4 : 5;
      const cell = Math.min(size / per, size / Math.ceil(visual.n / per)) * 0.92;
      return (
        <View style={[styles.group, { width: per * cell }]}>
          {Array.from({ length: visual.n }, (_, i) => (
            <EmojiImage key={i} emoji={visual.emoji} size={cell * 0.9} />
          ))}
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  badge: { borderWidth: OUTLINE.base, borderColor: OUTLINE.color, alignItems: 'center', justifyContent: 'center' },
  badgeEmpty: { backgroundColor: ACCENTS.purple.tint, borderStyle: 'dashed', borderColor: COLORS.inkFaint },
  badgeStar: { color: COLORS.surface },
  stars: { flexDirection: 'row', gap: 1, direction: 'ltr' },
  text: { fontFamily: FONTS.display, color: COLORS.ink, textAlign: 'center' },
  swatch: { borderWidth: OUTLINE.base, borderColor: OUTLINE.color },
  group: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', direction: 'ltr' },
});
