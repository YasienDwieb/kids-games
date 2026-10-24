// Letter Land — core domain types (no UI, no React imports).
//
// Built on the shared listen-and-find engine: a Letter (shared, see
// `@/games/_shared/letters`) is a FindItem enriched with the example-word key
// + its picture.

import type { FindRound } from '@/games/_shared/listen-find';
import type { Letter } from '@/games/_shared/letters';

export type { Letter };

/** Everything needed to render and evaluate one game level. */
export type LevelData = {
  /** 1-based level number. */
  readonly level: number;
  /** The round to play: choices + correctIndex + the target letter. */
  readonly round: FindRound & { readonly target: Letter };
};
