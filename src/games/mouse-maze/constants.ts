import { COLORS } from '@/sdk';

/** Grid grows by one cell per level, from START_SIZE up to MAX_SIZE. */
export const LEVEL = { START_SIZE: 5, MAX_SIZE: 9 } as const;

export function sizeForLevel(level: number): number {
  return Math.min(LEVEL.START_SIZE + (level - 1), LEVEL.MAX_SIZE);
}

export const STAR_COUNT = 3;

// Aligned to the warm design system (orange accent for this game).
export const MAZE_COLORS = {
  background: COLORS.canvas,
  wall: COLORS.ink,
  trail: 'rgba(244, 166, 90, 0.35)', // orange accent breadcrumbs
  hint: 'rgba(111, 194, 123, 0.6)', // green path hint
  hud: COLORS.surface,
  text: COLORS.ink,
};

/** Per-cell movement animation (ms) — just smooths the hop between adjacent cells. */
export const STEP_MS = 90;
export const WALL_WIDTH = 4;
/** How long the hint path stays lit (ms). */
export const HINT_MS = 1600;

export const EMOJI = { mouse: '🐭', goal: '🧀', star: '⭐' };
