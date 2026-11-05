import type { Glyph, Pt } from '../types';
import { arc, line, mirrorX, path } from './build';

/** `faces`: which way the `from` emoji looks when drawn (the clay 🐦 looks left). */
export type Warmup = Glyph & { from: string; to: string; faces?: 'left' };

function sample(n: number, f: (t: number) => Pt): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => f(i / n));
}

const ZIG: Pt[] = [
  [24, 65],
  [37, 35],
  [50, 65],
  [63, 35],
  [76, 65],
];

// Pre-writing strokes. The left-to-right ones span x 24-76 inside y 25-75, leaving
// room on the board for `from` before the start and `to` after the end.
export const WARMUPS: readonly Warmup[] = [
  { id: 'line', from: '🐶', to: '🦴', strokes: [path(line([24, 50], [76, 50]))] },
  { id: 'zigzag', from: '🐝', to: '🌻', strokes: [path(ZIG)] },
  {
    id: 'wave',
    from: '🐱',
    to: '🐟',
    strokes: [path(sample(72, (t) => [24 + 52 * t, 50 - 18 * Math.sin(t * 3 * Math.PI)]))],
  },
  {
    id: 'arch',
    from: '🐵',
    to: '🍌',
    strokes: [path(arc(37, 70, 13, 180, 360, 30), arc(63, 70, 13, 180, 360, 30))],
  },
  {
    // Two counter-clockwise loops (cursive "l" shape) moving right.
    id: 'loops',
    from: '🐭',
    to: '🧀',
    strokes: [
      path(
        sample(120, (t) => {
          const a = t * 4 * Math.PI;
          return [24 + (52 * a) / (4 * Math.PI) + 10 * Math.sin(a), 50 + 20 * Math.cos(a)];
        }),
      ),
    ],
  },
  {
    // From the outside on the left, one wide clockwise turn in to the open middle
    // (🥕 waits there); the rings stay a road's width apart.
    id: 'spiral',
    from: '🐰',
    to: '🥕',
    strokes: [
      path(
        sample(120, (t) => {
          const a = Math.PI + t * 2.1 * Math.PI;
          const r = 42 - 21 * t;
          return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
        }),
      ),
    ],
  },
  // From the top-right, counter-clockwise round to the lower right (the "c"/"o"
  // movement), leaving an opening so 🐦 and 🌳 each have their own spot.
  { id: 'circle', from: '🐦', to: '🌳', faces: 'left', strokes: [path(arc(50, 50, 28, -60, -320))] },
];

export function warmupFor(id: string, rtl: boolean): Glyph {
  const w = WARMUPS.find((g) => g.id === id);
  if (!w) throw new Error(`unknown warm-up: ${id}`);
  const glyph: Glyph = { id: w.id, strokes: w.strokes };
  return rtl ? mirrorX(glyph) : glyph;
}
