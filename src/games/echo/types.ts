// Echo — core domain types (no UI, no React imports).

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Opaque index into the active pad set (0-based).
 * Kept as `number` so the engine never hard-codes a pad count.
 */
export type PadId = number;

/**
 * Lifecycle phase of a single game session.
 *
 *  idle       → session hasn't started yet
 *  playback   → engine is replaying the sequence (input blocked)
 *  input      → player's turn to repeat the sequence
 *  win        → player completed a round (transient; advance to next round)
 *  gameover   → player tapped the wrong pad
 */
export type Phase = 'idle' | 'playback' | 'input' | 'win' | 'gameover';

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/**
 * Complete, serialisable snapshot of one Echo game session.
 * This is the only value the engine functions operate on — no side effects.
 */
export type GameState = {
  /** Ordered sequence of pad IDs the player must repeat. */
  readonly sequence: ReadonlyArray<PadId>;

  /**
   * Index into `sequence` of the next expected tap.
   * Equals 0 at the start of each round; equals `sequence.length` when
   * the round is complete (phase becomes `win`).
   */
  readonly inputIndex: number;

  /** 1-based round counter. Starts at 1 and increments each time the
   *  sequence is successfully repeated. */
  readonly round: number;

  /**
   * How many distinct pads are active this round.
   * Grows from INITIAL_PAD_COUNT toward MAX_PAD_COUNT as difficulty ramps.
   */
  readonly padCount: number;

  /**
   * Player's score for this session.
   * Defined as the length of the longest sequence successfully completed
   * (i.e. sequence.length at the moment of the last round-complete).
   * Starts at 0; UI may compare this against a persisted best score.
   */
  readonly score: number;

  /** Current lifecycle phase. */
  readonly phase: Phase;
};
