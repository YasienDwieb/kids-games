import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, EmojiImage, FONTS, SHADOWS } from '@/sdk';
import type { MatchItem } from '../types';

export type TileState = 'idle' | 'active' | 'matched';

type TileProps = {
  item: MatchItem;
  size: number;
  state: TileState;
  /** Accent line color used for the matched check + active ring. */
  accentColor: string;
};

/** One row item: a big emoji or a solid color swatch, with match/active cues. */
export function Tile({ item, size, state, accentColor }: TileProps) {
  const matched = state === 'matched';
  const active = state === 'active';
  return (
    <View
      style={[
        styles.frame,
        SHADOWS.sm,
        {
          width: size,
          height: size,
          borderRadius: BORDER_RADIUS.card,
          backgroundColor: item.kind === 'color' ? item.color : COLORS.surface,
          borderColor: active ? accentColor : matched ? accentColor : COLORS.line2,
          borderWidth: active ? 4 : matched ? 3 : 2,
          opacity: matched ? 0.92 : 1,
        },
      ]}
    >
      {item.kind === 'emoji' ? (
        <EmojiImage emoji={item.emoji} size={size * 0.62} />
      ) : item.kind === 'number' ? (
        <Text style={[styles.numeral, { fontSize: size * 0.5, color: COLORS.ink }]}>
          {item.n}
        </Text>
      ) : item.kind === 'group' ? (
        <View style={[styles.group, { maxWidth: size * 0.86 }]}>
          {Array.from({ length: item.n }).map((_, i) => (
            <EmojiImage key={i} emoji={item.emoji} size={size * 0.26} />
          ))}
        </View>
      ) : null}
      {matched ? (
        <View style={[styles.check, { backgroundColor: accentColor }]}>
          <Text style={styles.checkGlyph}>✓</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  numeral: { fontFamily: FONTS.displayBold, fontWeight: '900' },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  check: {
    position: 'absolute',
    top: -8,
    end: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  checkGlyph: { color: COLORS.surface, fontSize: 14, fontWeight: '900' },
});
