import { BALLOON_COLORS } from '../constants';
import type { LevelData } from '../types';

export const TOTAL_LEVELS = 8;

/**
 * Gentle difficulty ramp for ages 5–7. Difficulty comes from the balloons —
 * they rise faster, get smaller, and crowd the screen — while the quiver stays
 * comfortably above the quota (efficiency earns the 3rd star). No input precision.
 */
export function buildLevel(level: number): LevelData {
  const t = TOTAL_LEVELS > 1 ? (level - 1) / (TOTAL_LEVELS - 1) : 0; // 0..1
  const quota = 3 + Math.round(level * 0.9); // 4 → 10
  const arrows = quota + Math.max(2, 4 - Math.floor((level - 1) / 3)); // always > quota

  return {
    level,
    quota,
    arrows,
    spawnEveryMs: Math.round(1500 - t * 750), // 1500 → 750
    maxOnScreen: 3 + Math.floor(t * 3), // 3 → 6
    riseSpeed: 45 + t * 60, // 45 → 105 px/s
    swayAmp: 8 + t * 20,
    minR: 46 - t * 12, // 46 → 34
    maxR: 60 - t * 14, // 60 → 46
    colors: BALLOON_COLORS,
  };
}
