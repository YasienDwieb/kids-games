import type { Glyph, Pt } from '../types';

export function pathLength(points: readonly Pt[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/** Even arc-length spacing; keeps the first and last points. */
export function resample(points: readonly Pt[], spacing = 2): Pt[] {
  if (points.length < 2) return points.map((p) => [p[0], p[1]] as Pt);
  const total = pathLength(points);
  if (total === 0) return [points[0]];
  const count = Math.max(1, Math.ceil(total / spacing - 1e-9));
  const step = total / count;
  const out: Pt[] = [points[0]];
  let seg = 0;
  let segStart = 0;
  for (let k = 1; k < count; k++) {
    const target = k * step;
    for (;;) {
      const a = points[seg];
      const b = points[seg + 1];
      const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (segStart + segLen >= target || seg >= points.length - 2) {
        const t = segLen === 0 ? 0 : (target - segStart) / segLen;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        break;
      }
      segStart += segLen;
      seg++;
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

export function prepareGlyph(g: Glyph): Glyph {
  return {
    id: g.id,
    strokes: g.strokes.map((s) =>
      s.kind === 'dot' ? s : { kind: 'path', points: resample(s.points) },
    ),
  };
}
