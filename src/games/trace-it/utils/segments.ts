import { TRACK_WIDTH } from '../constants';
import type { Pt } from '../types';

/** One rotated View: `length` × `thickness`, centred on the segment midpoint. */
export type Seg = { left: number; top: number; length: number; thickness: number; angle: number };

/** Pixel geometry for drawing a box-unit polyline as rotated Views. */
export function segmentsFor(points: readonly Pt[], scale: number, thickness: number): Seg[] {
  const out: Seg[] = [];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const dx = (bx - ax) * scale;
    const dy = (by - ay) * scale;
    const length = Math.hypot(dx, dy);
    if (length === 0) continue;
    const mx = ((ax + bx) / 2) * scale;
    const my = ((ay + by) / 2) * scale;
    out.push({
      left: mx - length / 2,
      top: my - thickness / 2,
      length,
      thickness,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    });
  }
  return out;
}

/** Board pixels → box units, for a `side`-px board with `pad` px around the 0..100 box. */
export function toBox(x: number, y: number, side: number, pad: number): Pt {
  const scale = (side - 2 * pad) / 100;
  return [(x - pad) / scale, (y - pad) / scale];
}

/** Pixels per box unit and the pad that keeps the track inside a `side`-px board. */
export function boardMetrics(side: number): { scale: number; pad: number } {
  const scale = side / (100 + TRACK_WIDTH);
  return { scale, pad: (TRACK_WIDTH * scale) / 2 };
}
