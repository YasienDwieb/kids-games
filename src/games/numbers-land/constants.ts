// Numbers Land — domain constants (pure data, no React/UI).
//
// Inventory 1–10. `glyph` is the digit string rendered on a choice tile;
// `count` drives the hero count cluster (that many friendly objects).

import type { NumberItem } from './types';

export const NUMBERS: readonly NumberItem[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return { id: String(n), glyph: String(n), count: n };
});

/** Number of digit choices shown in a round. */
export const CHOICES_PER_ROUND = 3;

/** The friendly object repeated `count` times in the hero. */
export const HERO_EMOJI = '⭐';
