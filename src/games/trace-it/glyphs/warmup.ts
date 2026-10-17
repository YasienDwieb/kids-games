import type { Glyph, Pt } from '../types';
import { arc, line, mirrorX, path } from './build';

export type Warmup = Glyph & { from: string; to: string };

function sample(n: number, f: (t: number) => Pt): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => f(i / n));
}

const ZIG: Pt[] = [
  [10, 65],
  [23, 35],
  [37, 65],
  [50, 35],
  [63, 65],
  [77, 35],
  [90, 65],
];

// Pre-writing strokes, authored left to right inside y 25-75; `from` sits at the start, `to` at the end.
export const WARMUPS: readonly Warmup[] = [
  { id: 'line', from: '🐶', to: '🦴', strokes: [path(line([10, 50], [90, 50]))] },
  { id: 'zigzag', from: '🐝', to: '🌻', strokes: [path(ZIG)] },
  {
    id: 'wave',
    from: '🐱',
    to: '🐟',
    strokes: [path(sample(96, (t) => [10 + 80 * t, 50 - 18 * Math.sin(t * 4 * Math.PI)]))],
  },
  {
    id: 'arch',
    from: '🐵',
    to: '🍌',
    strokes: [path(arc(23.33, 70, 13.33, 180, 360, 30), arc(50, 70, 13.33, 180, 360, 30), arc(76.67, 70, 13.33, 180, 360, 30))],
  },
  {
    // Three counter-clockwise loops (cursive "l" shape) moving right.
    id: 'loops',
    from: '🐭',
    to: '🧀',
    strokes: [
      path(
        sample(180, (t) => {
          const a = t * 6 * Math.PI;
          return [10 + (80 * a) / (6 * Math.PI) + 10 * Math.sin(a), 50 + 20 * Math.cos(a)];
        }),
      ),
    ],
  },
  {
    // From the outside on the left, winding clockwise into the middle.
    id: 'spiral',
    from: '🐰',
    to: '🥕',
    strokes: [
      path(
        sample(180, (t) => {
          const a = Math.PI + t * 4 * Math.PI;
          const r = 25 - 21 * t;
          return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
        }),
      ),
    ],
  },
  // From the top-right, counter-clockwise all the way round (the "c"/"o" movement).
  { id: 'circle', from: '🐦', to: '🌳', strokes: [path(arc(50, 50, 25, -60, -420))] },
];

export function warmupFor(id: string, rtl: boolean): { glyph: Glyph; fromSide: 'left' | 'right' } {
  const w = WARMUPS.find((g) => g.id === id);
  if (!w) throw new Error(`unknown warm-up: ${id}`);
  const glyph: Glyph = { id: w.id, strokes: w.strokes };
  return rtl ? { glyph: mirrorX(glyph), fromSide: 'right' } : { glyph, fromSide: 'left' };
}
