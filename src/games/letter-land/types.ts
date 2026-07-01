// Letter Land — core domain types (no UI, no React imports).
//
// Built on the shared listen-and-find engine: a Letter is a FindItem (id +
// glyph) enriched with the example-word key + its picture.

import type { FindItem, FindRound } from '@/games/_shared/listen-find';

/**
 * One letter in an alphabet inventory.
 *
 * `glyph` is authored DATA, rendered literally (never translated).
 * `word` is the i18n KEY SUFFIX for the example word (e.g. 'apple' for the key
 * `letter-land:words.apple`) — NOT the literal word — so the example word
 * localizes per language at the call site.
 * `emoji` is the example word's picture (bundled via EmojiImage).
 */
export type Letter = FindItem & {
  /** i18n key suffix for the example word, resolved as `words.<word>`. */
  readonly word: string;
  /** Example-word picture glyph (rendered via EmojiImage). */
  readonly emoji: string;
};

/** Everything needed to render and evaluate one game level. */
export type LevelData = {
  /** 1-based level number. */
  readonly level: number;
  /** The round to play: choices + correctIndex + the target letter. */
  readonly round: FindRound & { readonly target: Letter };
};
