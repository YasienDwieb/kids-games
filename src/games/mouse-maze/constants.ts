import { COLORS } from '@/sdk';

/** Grid grows by one cell per level, from START_SIZE up to MAX_SIZE. */
export const LEVEL = { START_SIZE: 5, MAX_SIZE: 9 } as const;

export function sizeForLevel(level: number): number {
  return Math.min(LEVEL.START_SIZE + (level - 1), LEVEL.MAX_SIZE);
}

export const STAR_COUNT = 3;

export const MAZE_COLORS = {
  background: COLORS.background.warm,
  wall: '#6D4C41',
  trail: 'rgba(167, 139, 250, 0.35)',
  hint: 'rgba(123, 198, 126, 0.6)',
  hud: 'rgba(255, 255, 255, 0.9)',
  text: COLORS.text.primary,
};

/** Per-cell movement animation (ms) — just smooths the hop between adjacent cells. */
export const STEP_MS = 90;
export const WALL_WIDTH = 4;
/** How long the hint path stays lit (ms). */
export const HINT_MS = 1600;

export const EMOJI = { mouse: '🐭', goal: '🧀', star: '⭐' };
