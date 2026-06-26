// Letter Land — core domain types (no UI, no React imports).

// ---------------------------------------------------------------------------
// Letter
// ---------------------------------------------------------------------------

/**
 * One letter in an alphabet inventory.
 *
 * `glyph` is authored DATA, rendered literally (never translated).
 * `word` is the i18n KEY SUFFIX for the example word (e.g. 'apple' for the
 * key `letter-land:words.apple`) — NOT the literal word itself, so the
 * example word localizes per language at the call site.
 */
export type Letter = {
  /** Stable id, also the choice key. Latin: the uppercase letter ('A'..'Z'). Arabic: a latin-ish name ('alef', 'baa', …). */
  readonly id: string;
  /** The character to render on screen (literal, not translated). */
  readonly glyph: string;
  /** i18n key suffix for the example word, resolved as `words.<word>`. */
  readonly word: string;
};

// ---------------------------------------------------------------------------
// Round mode
// ---------------------------------------------------------------------------

/** The single round variant. Kept as a named type so callers don't churn. */
export type RoundMode = 'hearAndFind';

// ---------------------------------------------------------------------------
// Round
// ---------------------------------------------------------------------------

/**
 * hearAndFind — the target letter is spoken (name + sound + example word);
 * the child taps the matching letter among `choices`. This is the only round
 * variant: every level is hear-and-find.
 */
export type HearAndFindRound = {
  readonly mode: 'hearAndFind';
  /** The letter the child must find. */
  readonly target: Letter;
  /** The letters shown as choices (includes `target`). */
  readonly choices: readonly Letter[];
  /** 0-based index into `choices` that is `target`. */
  readonly correctIndex: number;
};

/** The round to play. Always a hear-and-find round. */
export type Round = HearAndFindRound;

// ---------------------------------------------------------------------------
// Level data
// ---------------------------------------------------------------------------

/** Everything needed to render and evaluate one game level. */
export type LevelData = {
  /** 1-based level number. */
  readonly level: number;
  /** The round to play (carries its own `mode` discriminator). */
  readonly round: Round;
};
