export const EMOJI = {
  basket: '🧺',
};

// Poki-style "shapes of things": fruits, sweets, drinks — higher value = rarer.
export const GOOD_ITEMS = [
  { emoji: '🍎', points: 5 },
  { emoji: '🍇', points: 5 },
  { emoji: '🍓', points: 5 },
  { emoji: '🍌', points: 5 },
  { emoji: '🍐', points: 5 },
  { emoji: '🍪', points: 8 },
  { emoji: '🧁', points: 8 },
  { emoji: '🍩', points: 8 },
  { emoji: '🍫', points: 8 },
  { emoji: '🍬', points: 10 },
  { emoji: '🍭', points: 10 },
  { emoji: '🍰', points: 10 },
  { emoji: '🧃', points: 12 },
  { emoji: '🍦', points: 12 },
] as const;

export const GOLD_ITEM = { emoji: '⭐', points: 20 } as const;
export const CHILI = { emoji: '🌶️' } as const;
export const BOMB = { emoji: '💣' } as const;

export const ITEM_SIZE = 56;
export const BASKET_WIDTH = 118;
export const BASKET_HEIGHT = 82;

/**
 * Falling items are drawn by a fixed pool of views that are mounted once and
 * reused. Nothing mounts or unmounts mid-level, so no view creation or image
 * decode ever lands in the middle of a fall. Comfortably above the most items
 * that can share the screen at the fastest spawn rate.
 */
export const ITEM_POOL = 10;

/** How eagerly the basket chases the finger (higher = snappier). */
export const BASKET_FOLLOW = 22;
/** Degrees the basket leans into its movement. */
export const BASKET_TILT_MAX = 9;
/** Fade-out for a caught/missed item, in ms. */
export const ITEM_FADE_MS = 130;
/** Seconds a slot rests after use, so it can't be respawned mid fade-out. */
export const SLOT_COOLDOWN = 0.25;

export type ItemKind = 'good' | 'gold' | 'bad' | 'bomb';

export interface LevelSpec {
  target: number; // points needed to clear the level
  spawnInterval: number; // ms between spawns
  fallSpeed: number; // px per second base
  hazardChance: number; // 0..1 chance a spawn is chili/bomb
  goldChance: number; // 0..1 chance a spawn is gold
}

/** Endless difficulty curve for the journey. Level 1 is slow & gentle. */
export function buildLevel(level: number): LevelSpec {
  return {
    target: 30 + (level - 1) * 15,
    spawnInterval: Math.max(420, 1050 - (level - 1) * 55),
    fallSpeed: 140 + (level - 1) * 18,
    hazardChance: Math.min(0.16, 0.06 + (level - 1) * 0.01),
    goldChance: 0.07,
  };
}
