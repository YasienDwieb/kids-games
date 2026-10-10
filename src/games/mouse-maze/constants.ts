import { ACCENTS, COLORS, POP } from '@/sdk';

/** Grid grows by one cell per level, from START_SIZE up to MAX_SIZE. */
export const LEVEL = { START_SIZE: 5, MAX_SIZE: 9 } as const;

export function sizeForLevel(level: number): number {
  return Math.min(LEVEL.START_SIZE + (level - 1), LEVEL.MAX_SIZE);
}

export const STAR_COUNT = 3;

// Claymorphism (ui-ux-pro-max): soft 3D clay built from stacked layers, no
// hard outlines — a grape clay tray on a lavender ground, orange clay walls
// (the game's accent), a cream floor (never pure white).
export const MAZE_COLORS = {
  background: ACCENTS.purple.tint,
  tray: ACCENTS.purple.base,
  trayDepth: ACCENTS.purple.deep,
  floor: COLORS.surface2,
  floorShade: COLORS.line,
  wall: ACCENTS.orange.base,
  wallDepth: ACCENTS.orange.deep,
  shine: COLORS.surface,
  goalPad: POP.zap,
  goalDepth: POP.zapDeep,
  token: COLORS.surface,
  tokenDepth: COLORS.line2,
  trail: ACCENTS.orange.base,
  hint: ACCENTS.blue.base,
  hud: COLORS.surface,
  text: COLORS.ink,
};

/** Clay tray rim around the floor (each side); hosts subtract 2× this when sizing cells. */
export const FRAME_PAD = 14;
/** Corner radius of the floor inside the tray. */
export const FLOOR_RADIUS = 28;
/** How far the clay "underside" layer sits below each piece. */
export const CLAY_DEPTH = 6;

/** Clay wall thickness for a given cell size. */
export const wallThickness = (cellSize: number) => Math.max(6, Math.round(cellSize * 0.2));

/** Mouse / cheese disc size: fits a corridor (cell minus a wall) with breathing room. */
export const pieceSize = (cellSize: number) => Math.round(cellSize - wallThickness(cellSize) - 8);

/** Per-cell movement animation (ms) — just smooths the hop between adjacent cells. */
export const STEP_MS = 90;
/** How long the hint path stays lit (ms). */
export const HINT_MS = 1600;

export const EMOJI = { mouse: '🐭', goal: '🧀', star: '⭐' };
