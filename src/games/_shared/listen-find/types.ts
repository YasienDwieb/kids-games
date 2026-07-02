// Shared listen-and-find domain types (no UI, no React imports).

/**
 * One choosable item in a listen-and-find inventory.
 *
 * A choice renders EITHER a glyph (letters, digits) OR an image (animal art) —
 * exactly one of the two. The union enforces this at the type level so a choice
 * can never be authored with both or neither:
 *   • `GlyphFindItem` — `glyph` is a literal character rendered as text (a letter
 *     or a digit). This is the original, unchanged shape.
 *   • `ImageFindItem` — `image` is a bundled `require(...)` module handle rendered
 *     via <Image>; used when a tile's face is a picture (Animal Safari).
 *
 * Both carry the same `id` (stable key + choice identity). Adding the image
 * variant is purely additive — existing glyph callers (Letter/Numbers Land) keep
 * passing `glyph` and are unaffected.
 */
type FindItemBase = {
  /** Stable id; also the choice key. */
  readonly id: string;
};

/** A choice whose face is a literal character (letter / digit). */
export type GlyphFindItem = FindItemBase & {
  /** Character rendered on a choice tile (literal DATA, never translated). */
  readonly glyph: string;
  readonly image?: undefined;
};

/** A choice whose face is a bundled image (a `require(...)` module handle). */
export type ImageFindItem = FindItemBase & {
  /** Bundled image module handle rendered via <Image> (from `require(...)`). */
  readonly image: number;
  readonly glyph?: undefined;
};

/** One choosable item: exactly one of a glyph face or an image face. */
export type FindItem = GlyphFindItem | ImageFindItem;

/** A built round: the choice set plus the index of the correct item. */
export type FindRound = {
  /** The items shown as choices (includes the target). */
  readonly choices: readonly FindItem[];
  /** 0-based index into `choices` that is the target. */
  readonly correctIndex: number;
};
