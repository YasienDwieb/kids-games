/**
 * The pigment engine — how paint mixes in this game.
 *
 * Mixing used to average sRGB channels, which is how *light* mixes, not paint. Blue and
 * yellow came out a 20%-saturation sage gray; all three primaries came out a blue-gray
 * that the game then labelled "Brown". The palette's secondary hexes had been back-fitted
 * to those averages, so challenges passed while showing the wrong color.
 *
 * The model here is an authored color-wheel triangle instead:
 *
 *   - State is an ordered drop log (see `addDrop`), capped at MIX_CAP. Color is a pure
 *     function of the log's tally, so mixing is order independent and reproducible —
 *     red+yellow+blue is the same brown however you got there.
 *   - Hue comes from a quadratic Bézier triangle over the barycentric coordinates of the
 *     three chromatic pigments. The three corners are the primary swatches and the three
 *     edge control points are solved so that each edge *midpoint* lands exactly on its
 *     authored secondary. That is what makes yellow+blue a real green rather than
 *     whatever the arithmetic happens to produce.
 *   - White and black are not on the wheel. They are a tint/shade axis, which is what they
 *     are in paint: white lerps the hue toward the white swatch, black toward the black
 *     swatch, each by its share of the pot.
 *
 * Every single pigment therefore renders as exactly its own palette swatch, which is the
 * invariant the whole feel of the game rests on. See `__tests__/wheelMix.test.ts`.
 */
import { COLORS } from '../constants';
import type { PigmentId } from '../types';

/** Pot size. Past this a drop is a no-op, so the mix can never be diluted to mud. */
export const MIX_CAP = 16;

export const PIGMENT_IDS: PigmentId[] = ['red', 'yellow', 'blue', 'white', 'black'];

type Rgb = readonly [number, number, number];

function rgbOf(id: PigmentId): Rgb {
  const hex = COLORS[id].hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

const RED = rgbOf('red');
const YELLOW = rgbOf('yellow');
const BLUE = rgbOf('blue');
const WHITE = rgbOf('white');
const BLACK = rgbOf('black');

/** The authored secondaries the wheel must pass through exactly at each edge midpoint. */
const ORANGE: Rgb = [0xf5, 0x7c, 0x00];
const GREEN: Rgb = [0x43, 0xa0, 0x47];
const PURPLE: Rgb = [0x8e, 0x24, 0xaa];

/**
 * Solve one edge's Bézier control point.
 *
 * On a quadratic Bézier triangle the midpoint of the red–yellow edge evaluates to
 * `0.25·red + 0.25·yellow + 0.5·control`, so pinning that midpoint to the authored orange
 * gives `control = 2·orange − 0.5·red − 0.5·yellow`. The control points land outside the
 * 0–255 cube (that is expected and fine — only the evaluated surface is clamped); the
 * bulge they create is exactly what keeps mid-ratios saturated instead of muddy.
 */
function controlPoint(corner1: Rgb, corner2: Rgb, midpoint: Rgb): Rgb {
  return [
    2 * midpoint[0] - 0.5 * corner1[0] - 0.5 * corner2[0],
    2 * midpoint[1] - 0.5 * corner1[1] - 0.5 * corner2[1],
    2 * midpoint[2] - 0.5 * corner1[2] - 0.5 * corner2[2],
  ];
}

const C_RY = controlPoint(RED, YELLOW, ORANGE);
const C_YB = controlPoint(YELLOW, BLUE, GREEN);
const C_RB = controlPoint(RED, BLUE, PURPLE);

/** Quadratic Bézier triangle over barycentric (u,v,w) = (red, yellow, blue) shares. */
function hueAt(u: number, v: number, w: number): Rgb {
  const channel = (i: 0 | 1 | 2): number =>
    u * u * RED[i] +
    v * v * YELLOW[i] +
    w * w * BLUE[i] +
    2 * u * v * C_RY[i] +
    2 * v * w * C_YB[i] +
    2 * u * w * C_RB[i];
  return [channel(0), channel(1), channel(2)];
}

function lerp(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

function toHex([r, g, b]: Rgb): string {
  const byte = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

export type PigmentTally = Record<PigmentId, number>;

/** Per-pigment counts for a log. Also the recipe we can show after a challenge. */
export function tally(log: readonly PigmentId[]): PigmentTally {
  const counts = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 } as PigmentTally;
  for (const id of log) counts[id] += 1;
  return counts;
}

/** Add one drop. Past the cap the pot is full and the log is returned unchanged. */
export function addDrop(log: readonly PigmentId[], drop: PigmentId): PigmentId[] {
  if (log.length >= MIX_CAP) return log as PigmentId[];
  return [...log, drop];
}

/** Remove the most recent drop. */
export function removeDrop(log: readonly PigmentId[]): PigmentId[] {
  return log.slice(0, -1);
}

/** The color of a pot, or null when it is empty. */
export function mixHex(log: readonly PigmentId[]): string | null {
  const n = log.length;
  if (n === 0) return null;

  const counts = tally(log);
  const chromatic = counts.red + counts.yellow + counts.blue;

  // With no chromatic pigment there is no hue to tint — start from white so that black
  // alone shades to the black swatch and white alone stays white.
  const hue =
    chromatic > 0
      ? hueAt(counts.red / chromatic, counts.yellow / chromatic, counts.blue / chromatic)
      : WHITE;

  const tinted = lerp(hue, WHITE, counts.white / n);
  const shaded = lerp(tinted, BLACK, counts.black / n);
  return toHex(shaded);
}

/**
 * The pot that comes closest to an arbitrary hex.
 *
 * Only needed to migrate colors saved before the pigment engine: those records are a bare
 * hex with no recipe, and dropping one back into a mix has to mean *something* in pigment
 * terms. Enumerates multisets (mixing is order independent, so sequences would be 5^n
 * redundant work), and is called once at migration — never from a render path.
 */
export function fitLog(hex: string, maxDrops = 5): PigmentId[] {
  const target = labOf(hex);
  let best: PigmentId[] = ['white'];
  let bestErr = Infinity;

  const walk = (start: number, pot: PigmentId[]) => {
    if (pot.length > 0) {
      const err = squaredLabError(labOf(mixHex(pot)!), target);
      if (err < bestErr) {
        bestErr = err;
        best = [...pot];
      }
    }
    if (pot.length === maxDrops) return;
    for (let i = start; i < PIGMENT_IDS.length; i++) {
      pot.push(PIGMENT_IDS[i]);
      walk(i, pot);
      pot.pop();
    }
  };
  walk(0, []);
  return best;
}

// A cheap perceptual-ish distance: full CIEDE2000 here would pull utils/deltaE into the
// engine and buy nothing, since we only need the argmin over a few hundred candidates.
function labOf(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = lin(parseInt(clean.slice(0, 2), 16));
  const g = lin(parseInt(clean.slice(2, 4), 16));
  const b = lin(parseInt(clean.slice(4, 6), 16));
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function squaredLabError(a: Rgb, b: Rgb): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}
