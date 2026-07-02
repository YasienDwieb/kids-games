// Shared listen-and-find domain types (no UI, no React imports).

/** One choosable item in a listen-and-find inventory (a letter or a digit). */
export type FindItem = {
  /** Stable id; also the choice key. */
  readonly id: string;
  /** Character rendered on a choice tile (literal DATA, never translated). */
  readonly glyph: string;
};

/** A built round: the choice set plus the index of the correct item. */
export type FindRound = {
  /** The items shown as choices (includes the target). */
  readonly choices: readonly FindItem[];
  /** 0-based index into `choices` that is the target. */
  readonly correctIndex: number;
};
