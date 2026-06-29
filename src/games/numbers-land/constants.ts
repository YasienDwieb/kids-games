// Numbers Land — domain constants (pure data, no React/UI).
//
// Inventory 1–10. `glyph` is the digit string rendered on a choice tile;
// `count` drives the hero count cluster (that many friendly objects).

import type { NumberItem } from './types';

// One friendly (bundled) object per number, so each count cluster looks
// different — 1 apple, 2 oranges, 3 stars, … (all glyphs are in the emoji map).
const HERO_EMOJI: readonly string[] = ['🍎', '🍊', '⭐', '🍌', '⚽', '🐟', '🌹', '🦆', '🐸', '🍋'];

export const NUMBERS: readonly NumberItem[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return { id: String(n), glyph: String(n), count: n, emoji: HERO_EMOJI[i] };
});

/** Number of digit choices shown in a round. */
export const CHOICES_PER_ROUND = 3;
