// Match Up — core domain types (no UI, no React imports).

/** A single tile's visual: an emoji glyph, or a solid color swatch. */
export type MatchItem =
  | { readonly kind: 'emoji'; readonly emoji: string }
  | { readonly kind: 'color'; readonly color: string };

/** One top↔bottom relationship (e.g. 🐰 ↔ 🥕). */
export type MatchPair = {
  readonly top: MatchItem;
  readonly bottom: MatchItem;
};

/**
 * One round: the two displayed rows plus the answer key. `solution[i]` is the
 * index into `bottom` that matches `top[i]`. The bottom row is shuffled, so
 * `solution` is a permutation of `0..top.length-1`.
 */
export type RoundData = {
  readonly themeId: string;
  /** Translation key (relative to the game namespace), e.g. 'prompts.animalFood'. */
  readonly promptKey: string;
  readonly top: readonly MatchItem[];
  readonly bottom: readonly MatchItem[];
  readonly solution: readonly number[];
};
