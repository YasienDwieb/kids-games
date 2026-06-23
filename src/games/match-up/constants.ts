// Match Up — tuning constants (no React/UI imports).

/** Levels in one standalone run and units the flow adapter contributes. */
export const TOTAL_LEVELS = 8;

/** Pairs per round: 3 for the first four levels, then 4. */
export function pairCountForLevel(level: number): number {
  return level <= 4 ? 3 : 4;
}

/** Score awarded per correct connection (standalone free play). */
export const POINTS_PER_MATCH = 10;

/** Count-matching: numbers are drawn from 1..MAX_COUNT (cap so a group tile fits). */
export const MAX_COUNT = 5;

/** Tile + connection-line sizing (px). */
export const TILE_SIZE = 84;
export const LINE_THICKNESS = 9;
