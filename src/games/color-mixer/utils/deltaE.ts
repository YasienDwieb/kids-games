/**
 * Perceptual color difference (CIEDE2000).
 *
 * Matching used to be Euclidean distance in sRGB under a flat threshold of 60. RGB
 * distance does not track what a person actually sees — 60 is generous in the blues and
 * miserly in the greens — so "so close!" and "you got it!" landed at inconsistent places.
 *
 * The metric is pinned to CIEDE2000 explicitly, not left implicit: ΔE76 and ΔE00 differ by
 * roughly 2x across this palette, so the choice alone decides whether a near-miss counts.
 * Thresholds elsewhere in the game are ΔE00 numbers and are meaningless under any other
 * metric.
 */

export type Lab = readonly [number, number, number];

const D65_X = 95.047;
const D65_Y = 100.0;
const D65_Z = 108.883;

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function pivot(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

/** sRGB hex → CIE L*a*b* (D65, 2° observer). */
export function labFromHex(hex: string): Lab {
  const clean = hex.replace('#', '');
  const r = srgbToLinear(parseInt(clean.slice(0, 2), 16));
  const g = srgbToLinear(parseInt(clean.slice(2, 4), 16));
  const b = srgbToLinear(parseInt(clean.slice(4, 6), 16));

  const x = pivot(((r * 0.4124 + g * 0.3576 + b * 0.1805) * 100) / D65_X);
  const y = pivot(((r * 0.2126 + g * 0.7152 + b * 0.0722) * 100) / D65_Y);
  const z = pivot(((r * 0.0193 + g * 0.1192 + b * 0.9505) * 100) / D65_Z);

  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * CIEDE2000 difference between two Lab colors.
 *
 * Implemented per Sharma, Wu & Dalal (2005), including the hue-angle branches that a naive
 * transcription gets wrong: `atan2(0,0)` is undefined for a neutral gray, so a zero-chroma
 * color must contribute no hue rather than an arbitrary 0°.
 */
export function deltaE00(lab1: Lab, lab2: Lab): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const meanC = (C1 + C2) / 2;

  const meanC7 = meanC ** 7;
  const G = 0.5 * (1 - Math.sqrt(meanC7 / (meanC7 + 25 ** 7)));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  // A neutral color has no hue angle at all; forcing one would fabricate a hue difference.
  const h1p = C1p === 0 ? 0 : (toDeg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = C2p === 0 ? 0 : (toDeg(Math.atan2(b2, a2p)) + 360) % 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(toRad(dhp) / 2);

  const meanLp = (L1 + L2) / 2;
  const meanCp = (C1p + C2p) / 2;

  let meanHp: number;
  if (C1p * C2p === 0) {
    meanHp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    meanHp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    meanHp = (h1p + h2p + 360) / 2;
  } else {
    meanHp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(toRad(meanHp - 30)) +
    0.24 * Math.cos(toRad(2 * meanHp)) +
    0.32 * Math.cos(toRad(3 * meanHp + 6)) -
    0.2 * Math.cos(toRad(4 * meanHp - 63));

  const dTheta = 30 * Math.exp(-(((meanHp - 275) / 25) ** 2));
  const meanCp7 = meanCp ** 7;
  const Rc = 2 * Math.sqrt(meanCp7 / (meanCp7 + 25 ** 7));
  const Rt = -Rc * Math.sin(toRad(2 * dTheta));

  const meanLpOffset = (meanLp - 50) ** 2;
  const Sl = 1 + (0.015 * meanLpOffset) / Math.sqrt(20 + meanLpOffset);
  const Sc = 1 + 0.045 * meanCp;
  const Sh = 1 + 0.015 * meanCp * T;

  const termL = dLp / (kL * Sl);
  const termC = dCp / (kC * Sc);
  const termH = dHp / (kH * Sh);

  return Math.sqrt(termL ** 2 + termC ** 2 + termH ** 2 + Rt * termC * termH);
}

/** CIEDE2000 difference between two sRGB hex colors. */
export function deltaE00Hex(a: string, b: string): number {
  return deltaE00(labFromHex(a), labFromHex(b));
}
