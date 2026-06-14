/**
 * Echo — pure game-state engine.
 *
 * All functions are pure reducers: they accept a `GameState` (and sometimes a
 * `seed`) and return a new `GameState` or a labelled result object.  No timers,
 * no side effects, no React or React Native imports.
 *
 * Determinism is guaranteed by the seeded mulberry32 PRNG — pass the same seed
 * to get identical behaviour across runs, which makes unit testing trivial.
 */

import type { GameState, PadId } from '../types';
import {
  INITIAL_PAD_COUNT,
  MAX_PAD_COUNT,
  PLAYBACK_LIT_MS,
  PLAYBACK_GAP_MS,
  PLAYBACK_LIT_MS_MIN,
  PLAYBACK_GAP_MS_MIN,
} from '../constants';

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (mirrors shape-detective/utils/generate.ts)
// ---------------------------------------------------------------------------

/** Returns a stateful PRNG function from a 32-bit integer seed. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Difficulty ramp
// ---------------------------------------------------------------------------

/**
 * Returns playback parameters for the given (1-based) round.
 *
 * Ramp strategy:
 *  - `padCount` stays at INITIAL_PAD_COUNT until round 5, then grows to
 *    MAX_PAD_COUNT at round 8.
 *  - `litMs` and `gapMs` shrink linearly from their starting values to their
 *    minimum values over the first 20 rounds, then stay at the minimum.
 *
 * The ramp is strictly monotonic: difficultyFor(n+1) is never *easier* than
 * difficultyFor(n) on any axis.
 */
export function difficultyFor(round: number): {
  padCount: number;
  litMs: number;
  gapMs: number;
} {
  // Clamp round to a safe lower bound
  const r = Math.max(1, round);

  // padCount: step up from INITIAL_PAD_COUNT to MAX_PAD_COUNT
  const PAD_RAMP_START = 5; // round at which padCount first increases
  const PAD_RAMP_END = 8;   // round at which padCount reaches MAX_PAD_COUNT
  const padRange = MAX_PAD_COUNT - INITIAL_PAD_COUNT;
  const padT = Math.min(1, Math.max(0, (r - PAD_RAMP_START) / (PAD_RAMP_END - PAD_RAMP_START)));
  const padCount = INITIAL_PAD_COUNT + Math.round(padT * padRange);

  // litMs / gapMs: linear ramp from starting values down to mins over 20 rounds
  const SPEED_RAMP_ROUNDS = 20;
  const speedT = Math.min(1, Math.max(0, (r - 1) / SPEED_RAMP_ROUNDS));
  const litMs = Math.round(PLAYBACK_LIT_MS - speedT * (PLAYBACK_LIT_MS - PLAYBACK_LIT_MS_MIN));
  const gapMs = Math.round(PLAYBACK_GAP_MS - speedT * (PLAYBACK_GAP_MS - PLAYBACK_GAP_MS_MIN));

  return { padCount, litMs, gapMs };
}

// ---------------------------------------------------------------------------
// State factories
// ---------------------------------------------------------------------------

/** Build the canonical initial state (before the first sequence is generated). */
function makeInitialState(): GameState {
  return {
    sequence: [],
    inputIndex: 0,
    round: 1,
    padCount: INITIAL_PAD_COUNT,
    score: 0,
    phase: 'idle',
  };
}

// ---------------------------------------------------------------------------
// Engine functions
// ---------------------------------------------------------------------------

/**
 * Start a new game session.
 *
 * Creates round 1 with a starting sequence of length 2 (per spec: "start at
 * sequence length 2").  Phase is set to `playback` so the UI can immediately
 * begin animating the sequence.
 *
 * @param seed - Integer seed for the PRNG; use a stable value (e.g. Date.now())
 *               in production, or a fixed value in tests for determinism.
 */
export function startGame(seed: number): GameState {
  const rand = mulberry32(seed);
  const difficulty = difficultyFor(1);

  // Build initial sequence of length 2
  const sequence: PadId[] = [
    Math.floor(rand() * difficulty.padCount),
    Math.floor(rand() * difficulty.padCount),
  ];

  return {
    ...makeInitialState(),
    sequence,
    padCount: difficulty.padCount,
    phase: 'playback',
  };
}

/**
 * Append a new random pad to the sequence.
 *
 * Used internally by `advanceRound` but also exported so the UI can call it
 * independently if needed (e.g. when re-seeding mid-session).
 *
 * @param state - Current game state (any phase).
 * @param seed  - Seed for the PRNG (should differ from prior seeds to avoid
 *                repeating the same choice — e.g. seed + round).
 */
export function appendStep(state: GameState, seed: number): GameState {
  const rand = mulberry32(seed);
  const newPad: PadId = Math.floor(rand() * state.padCount);
  return {
    ...state,
    sequence: [...state.sequence, newPad],
  };
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

export type CheckInputResult =
  | { result: 'correct'; state: GameState }
  | { result: 'wrong'; state: GameState }
  | { result: 'round-complete'; state: GameState };

/**
 * Process one tap from the player.
 *
 * - Terminal phases (`win` / `gameover`) → no-op; returns state unchanged with
 *   result `'wrong'` (ignored by the UI, which should already gate input).
 * - Correct & not the last step  → advance `inputIndex`, stay in `input` phase.
 * - Correct & last step          → phase `win`; score updated to sequence length.
 * - Wrong pad                    → phase `gameover`; score unchanged.
 *
 * This function does NOT modify the sequence or advance the round — that is
 * `advanceRound`'s responsibility.
 */
export function checkInput(state: GameState, pad: PadId): CheckInputResult {
  // Phase guard: terminal phases are irreversible — reject all input silently.
  if (state.phase === 'gameover' || state.phase === 'win') {
    return { result: 'wrong', state };
  }

  const expected = state.sequence[state.inputIndex];

  if (pad !== expected) {
    // Wrong — game over; score is already the best sequence completed so far
    return {
      result: 'wrong',
      state: { ...state, phase: 'gameover' },
    };
  }

  const nextIndex = state.inputIndex + 1;

  if (nextIndex === state.sequence.length) {
    // Last correct tap — round complete; update score to current sequence length
    return {
      result: 'round-complete',
      state: {
        ...state,
        inputIndex: nextIndex,
        score: state.sequence.length,
        phase: 'win',
      },
    };
  }

  // Correct, more taps to go
  return {
    result: 'correct',
    state: { ...state, inputIndex: nextIndex },
  };
}

// ---------------------------------------------------------------------------
// Round advancement
// ---------------------------------------------------------------------------

/**
 * Transition from a completed round to the next.
 *
 * - Grows the sequence by exactly one new random pad.
 * - Increments `round`.
 * - Re-evaluates `padCount` via `difficultyFor`.
 * - Resets `inputIndex` to 0.
 * - Sets phase to `playback`.
 *
 * Must only be called when `state.phase === 'win'`.
 *
 * @param state - State in the `win` phase.
 * @param seed  - Seed for choosing the new pad (use `round` as part of the seed
 *                to keep each round's addition deterministic under a root seed).
 */
export function advanceRound(state: GameState, seed: number): GameState {
  const nextRound = state.round + 1;
  const difficulty = difficultyFor(nextRound);

  // Append one new step, then update round/padCount/inputIndex/phase
  const withNewStep = appendStep(
    { ...state, padCount: difficulty.padCount },
    seed,
  );

  return {
    ...withNewStep,
    round: nextRound,
    inputIndex: 0,
    phase: 'playback',
  };
}
