import {
  COLORS,
  DISCOVERY_DELTA_E,
  METER_RANGE_DELTA_E,
  STARS_TO_COMPLETE,
  STAR_DELTA_E,
} from '../constants';
import { deltaE00Hex } from './deltaE';
import type { ColorId } from '../types';

/** The discoverable (non-primary) colors. */
export const FAMOUS_IDS: ColorId[] = (Object.keys(COLORS) as ColorId[]).filter(
  (id) => !COLORS[id].isPrimary,
);

/** Perceptual distance between two hex colors (CIEDE2000). */
export function colorDistance(a: string, b: string): number {
  return deltaE00Hex(a, b);
}

/** Closest famous color within the discovery threshold, else null. */
export function nearestFamous(hex: string): ColorId | null {
  let best: ColorId | null = null;
  let bestDist = DISCOVERY_DELTA_E;
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
  return Math.max(0, 1 - colorDistance(hex, targetHex) / METER_RANGE_DELTA_E);
}

/**
 * Graded challenge score, 0–3.
 *
 * Scoring is graded rather than binary so a child can see themselves getting closer. One
 * star is feedback, not success: ΔE00 12 is plainly a different color, so completing on it
 * would mean "you made Green!" over something visibly not green.
 */
export function starsFor(mixHex: string | null, targetHex: string): 0 | 1 | 2 | 3 {
  if (mixHex == null) return 0;
  const d = colorDistance(mixHex, targetHex);
  if (d < STAR_DELTA_E.three) return 3;
  if (d < STAR_DELTA_E.two) return 2;
  if (d < STAR_DELTA_E.one) return 1;
  return 0;
}

/** Whether a blend is good enough to finish a challenge. */
export function isChallengeMet(mixHex: string | null, targetHex: string): boolean {
  return starsFor(mixHex, targetHex) >= STARS_TO_COMPLETE;
}
