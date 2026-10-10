import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, EmojiImage, FONTS, OUTLINE, SHADOWS } from '@/sdk';
import type { MatchItem } from '../types';

export type TileState = 'idle' | 'active' | 'matched';

type TileProps = {
  item: MatchItem;
  size: number;
  state: TileState;
  /** Accent line color used for the active ring + matched fallback. */
  accentColor: string;
  /** When matched, the specific connection color (overrides accentColor). */
  lineColor?: string;
};

/** One row item: a big emoji or a solid color swatch, with match/active cues. */
export function Tile({ item, size, state, accentColor, lineColor }: TileProps) {
  const matched = state === 'matched';
  const active = state === 'active';
  const matchColor = lineColor ?? accentColor;
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
          borderColor: active ? accentColor : matched ? matchColor : OUTLINE.color,
          borderWidth: active ? OUTLINE.thick : OUTLINE.base,
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
        <View style={[styles.check, { backgroundColor: matchColor }]}>
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
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
  },
  checkGlyph: { color: COLORS.ink, fontSize: 14, fontWeight: '900' },
});
