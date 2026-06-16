// Count & Pop — core domain types (no UI, no React imports).

// ---------------------------------------------------------------------------
// Round modes
// ---------------------------------------------------------------------------

/** Discriminator for the four round variants. */
export type RoundMode = 'countThisMany' | 'howMany' | 'makeN' | 'addition';

// ---------------------------------------------------------------------------
// Round discriminated union
// ---------------------------------------------------------------------------

/**
 * countThisMany — kid pops exactly `target` objects from a field of tiles.
 * The UI shows >= target tiles; the player taps until count reaches target.
 */
export type CountThisManyRound = {
  readonly mode: 'countThisMany';
  /** How many objects the player must pop (1 .. MAX_OBJECTS). */
  readonly target: number;
  /** Emoji for the tappable objects, e.g. "🍎". */
  readonly objectEmoji: string;
};

/**
 * howMany — a set of objects is shown; player picks the numeral that matches.
 */
export type HowManyRound = {
  readonly mode: 'howMany';
  /** The count of objects shown on screen. */
  readonly count: number;
  /** Emoji used to render the objects. */
  readonly objectEmoji: string;
  /** Numeral choices presented to the player. */
  readonly choices: readonly number[];
  /** 0-based index into `choices` that is the correct answer. */
  readonly correctIndex: number;
};

/**
 * makeN — player sees `have` objects and must choose how many MORE to add
 * to reach `target`. Correct answer = target − have.
 */
export type MakeNRound = {
  readonly mode: 'makeN';
  /** Objects already present. */
  readonly have: number;
  /** Total objects required. */
  readonly target: number;
  /** Emoji used to render existing and added objects. */
  readonly objectEmoji: string;
  /** Numeral choices (how many to add). */
  readonly choices: readonly number[];
  /** 0-based index into `choices` that is the correct answer (target − have). */
  readonly correctIndex: number;
};

/**
 * addition — player sees two groups of objects and chooses the sum.
 */
export type AdditionRound = {
  readonly mode: 'addition';
  /** First addend. */
  readonly a: number;
  /** Second addend. */
  readonly b: number;
  /** Emoji used to render both groups. */
  readonly objectEmoji: string;
  /** Numeral choices (which equals a + b). */
  readonly choices: readonly number[];
  /** 0-based index into `choices` that is the correct answer (a + b). */
  readonly correctIndex: number;
};

/** Discriminated union of all round variants. */
export type Round = CountThisManyRound | HowManyRound | MakeNRound | AdditionRound;

// ---------------------------------------------------------------------------
// Level data
// ---------------------------------------------------------------------------

/** Everything needed to render and evaluate one game level. */
export type LevelData = {
  /** 1-based level number. */
  readonly level: number;
  /** Which mode this level uses. */
  readonly mode: RoundMode;
  /** The round to play. */
  readonly round: Round;
};
