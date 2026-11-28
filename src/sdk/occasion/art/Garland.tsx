import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { OUTLINE } from '@/constants/dimensions';
import { ArtPiece, artWidth, type OccasionArt } from './ArtPiece';

/** Points along a wire hung from both top corners, sagging `sag` in the middle. */
export function garlandPoints(width: number, sag: number, count: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    return { x: t * width, y: sag * 4 * t * (1 - t) };
  });
}

const SEGMENTS = 24;
const STRING = 10;

/**
 * A string of lights across the top of the screen: a drooping wire with the
 * pieces hanging from it, cycling through `items`. Decorative and
 * touch-transparent; symmetric, so it needs no RTL mirroring.
 */
export function Garland({ items, size = 30, spacing = 78, sag = 34 }: { items: readonly OccasionArt[]; size?: number; spacing?: number; sag?: number }) {
  const { width } = useWindowDimensions();
  if (items.length === 0 || width <= 0) return null;
  const count = Math.max(items.length, Math.floor(width / spacing));
  const line = Math.max(1.5, size * 0.07);

  // The wire, as short straight segments along the curve.
  const curve = Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    const t = i / SEGMENTS;
    return { x: t * width, y: sag * 4 * t * (1 - t) };
  });
  const wire = curve.slice(1).map((b, i) => {
    const a = curve[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    return (
      <View
        key={`w${i}`}
        style={[
          styles.wire,
          {
            width: len + 1,
            height: line,
            left: (a.x + b.x) / 2 - (len + 1) / 2,
            top: (a.y + b.y) / 2 - line / 2,
            transform: [{ rotate: `${angle}rad` }],
          },
        ]}
      />
    );
  });

  const pieces = garlandPoints(width, sag, count).map((p, i) => {
    const art = items[i % items.length];
    // Lanterns hang a little bigger than the stars and moons between them.
    const s = art.kind === 'fanoos' ? size * 1.3 : size;
    const w = artWidth(art, s);
    return (
      <View key={`p${i}`} style={[styles.piece, { left: p.x - w / 2, top: p.y }]} testID="occasion-garland-piece">
        <View style={[styles.string, { width: line, height: STRING, marginLeft: w / 2 - line / 2 }]} />
        <ArtPiece art={art} size={s} />
      </View>
    );
  });

  return (
    <View style={[styles.root, { height: sag + STRING + size * 1.4 }]} pointerEvents="none">
      {wire}
      {pieces}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, direction: 'ltr' },
  wire: { position: 'absolute', backgroundColor: OUTLINE.color, opacity: 0.55, borderRadius: 2 },
  piece: { position: 'absolute' },
  string: { backgroundColor: OUTLINE.color, opacity: 0.55 },
});
