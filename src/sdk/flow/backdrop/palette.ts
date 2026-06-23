/** Parse #rgb or #rrggbb into [r,g,b] (0–255). */
function parseHex(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

const clamp01 = (p: number) => (p < 0 ? 0 : p > 1 ? 1 : p);

/**
 * Linearly interpolate across an ordered list of hex color stops.
 * progress 0 → first stop, 1 → last stop; evenly spaced segments.
 */
export function rampColor(stops: readonly string[], progress: number): string {
  if (stops.length === 0) return '#000000';
  if (stops.length === 1) return stops[0];
  const p = clamp01(progress);
  const segments = stops.length - 1;
  const scaled = p * segments;
  const i = Math.min(Math.floor(scaled), segments - 1);
  const t = scaled - i;
  const [r1, g1, b1] = parseHex(stops[i]);
  const [r2, g2, b2] = parseHex(stops[i + 1]);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}
