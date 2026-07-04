// Animal Safari — core domain types (no UI, no React imports).
//
// Two round modes alternate by level (mirrors letter-land's modeForLevel):
//   • hearName   — the animal NAME is spoken; child taps the matching animal.
//   • whichSound — the animal SOUND is played; child taps the animal that
//                  makes it. The target (and every choice) MUST have a sound,
//                  so cow (no clip) can never appear in a whichSound round.

// ---------------------------------------------------------------------------
// Animal
// ---------------------------------------------------------------------------

/**
 * One animal in the inventory.
 *
 * `emoji` is authored DATA, rendered literally (never translated).
 * `nameKey` is the i18n KEY SUFFIX for the animal's name (resolved as
 * `animal-safari:names.<nameKey>`) — NOT the literal name — so it localizes
 * per language at the call site. By convention `nameKey === id`.
 * `hasSound` is true when a real CC0/PD audio clip exists for the animal
 * (every animal except cow); only sound-bearing animals may take part in a
 * `whichSound` round.
 */
export type Animal = {
  /** Stable id, also the choice key and the `useSound().play(id)` intent. */
  readonly id: string;
  /** The emoji to render on screen (literal, not translated). */
  readonly emoji: string;
  /** i18n key suffix for the animal name, resolved as `names.<nameKey>`. */
  readonly nameKey: string;
  /** True when a real audio clip exists (false only for cow). */
  readonly hasSound: boolean;
};

// ---------------------------------------------------------------------------
// Round mode
// ---------------------------------------------------------------------------

/** The two round variants, alternating by level parity. */
export type RoundMode = 'hearName' | 'whichSound';

// ---------------------------------------------------------------------------
// Round (discriminated union on `mode`)
// ---------------------------------------------------------------------------

/**
 * hearName — the animal NAME is spoken (via useSpeech); the child taps the
 * matching animal among `choices`. Choices may be drawn from ALL animals
 * (cow included).
 */
export type HearNameRound = {
  readonly mode: 'hearName';
  /** The animal the child must find. */
  readonly target: Animal;
  /** The animals shown as choices (includes `target`). */
  readonly choices: readonly Animal[];
  /** 0-based index into `choices` that is `target`. */
  readonly correctIndex: number;
};

/**
 * whichSound — the animal SOUND is played (via useSound); the child taps the
 * animal that makes it. The `target` MUST have a sound, and every choice is
 * also drawn from the sound-bearing subset so each option could plausibly be
 * the source of the sound (cow can never appear here).
 */
export type WhichSoundRound = {
  readonly mode: 'whichSound';
  /** The animal whose sound was played — always has `hasSound: true`. */
  readonly target: Animal;
  /** The animals shown as choices (includes `target`; all sound-bearing). */
  readonly choices: readonly Animal[];
  /** 0-based index into `choices` that is `target`. */
  readonly correctIndex: number;
};

/** The round to play, discriminated by `mode`. */
export type Round = HearNameRound | WhichSoundRound;

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
