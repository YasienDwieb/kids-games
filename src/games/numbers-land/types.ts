// Numbers Land — core domain types (no UI, no React imports).
//
// Built on the shared listen-and-find engine: a NumberItem is a FindItem
// (id + glyph) enriched with its count (how many hero objects to show).

import type { FindItem, FindRound } from '@/games/_shared/listen-find';

/** One number in the inventory. `glyph` is the digit string ('1'..'10'). */
export type NumberItem = FindItem & {
  /** How many hero objects represent this number (the count cluster). */
  readonly count: number;
};

/** Everything needed to render and evaluate one game level. */
export type LevelData = {
  readonly level: number;
  readonly round: FindRound & { readonly target: NumberItem };
};
