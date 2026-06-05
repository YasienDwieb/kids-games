import { COLORS, MATCH_THRESHOLD } from '../constants';
import { hexToRgb } from './colorMath';
import type { ColorId } from '../types';

/** The discoverable (non-primary) colors. */
export const FAMOUS_IDS: ColorId[] = (Object.keys(COLORS) as ColorId[]).filter(
  (id) => !COLORS[id].isPrimary,
);

/** Euclidean RGB distance between two hex colors. */
export function colorDistance(a: string, b: string): number {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return Math.sqrt((x.r - y.r) ** 2 + (x.g - y.g) ** 2 + (x.b - y.b) ** 2);
}

/** Closest famous color within MATCH_THRESHOLD, else null. */
export function nearestFamous(hex: string): ColorId | null {
  let best: ColorId | null = null;
  let bestDist = MATCH_THRESHOLD;
  for (const id of FAMOUS_IDS) {
    const d = colorDistance(hex, COLORS[id].hex);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

/** 0..1 progress toward a target (1 = exact), for the challenge meter only. */
export function closeness(hex: string, targetHex: string): number {
  const RANGE = 180; // distance over which the meter fills
  return Math.max(0, 1 - colorDistance(hex, targetHex) / RANGE);
}

/** Whether a blend satisfies a challenge target. */
export function isChallengeMet(mixHex: string | null, targetHex: string): boolean {
  return mixHex != null && colorDistance(mixHex, targetHex) < MATCH_THRESHOLD;
}
