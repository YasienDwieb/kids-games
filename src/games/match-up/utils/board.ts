/**
 * Match Up — pure board helpers (no React/UI). Used by MatchBoard for forgiving
 * hit-testing and per-connection line coloring.
 */
type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

/**
 * Index of the nearest non-null rect whose CENTER is within `maxDist` of `point`,
 * or -1 if none qualifies. Lets a child release near a tile, not exactly on it.
 */
export function nearestLooseIndex(
  rects: readonly (Rect | null)[],
  point: Point,
  maxDist: number,
): number {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (!r) continue;
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const d = Math.hypot(point.x - cx, point.y - cy);
    if (d <= maxDist && d < bestDist) {
      best = i;
      bestDist = d;
    }
  }
  return best;
}

/** Pick a stable per-connection color, cycling through the palette by order. */
export function lineColorFor(index: number, palette: readonly string[]): string {
  return palette[index % palette.length];
}
