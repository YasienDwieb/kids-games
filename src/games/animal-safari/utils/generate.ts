/**
 * Animal Safari — deterministic round builders.
 *
 * All builders accept a `seed` so generation is fully deterministic and stable
 * across app restarts. Math.random(), Date.now(), and timers are never used.
 *
 * Two round modes alternate by level parity (see `modeForLevel`):
 *   • hearName   — target + choices may come from ALL animals (cow included).
 *   • whichSound — target + choices come ONLY from the sound-bearing subset
 *                  (`SOUND_ANIMALS`), so cow can never appear.
 */

import { ANIMALS, CHOICES_PER_ROUND, modeForLevel } from '../constants';
import type { Animal, Round } from '../types';

// ---------------------------------------------------------------------------
// Sound-bearing subset — the only animals eligible for a whichSound round.
// ---------------------------------------------------------------------------

/** Every animal with a real audio clip (`hasSound`) — excludes cow. */
export const SOUND_ANIMALS: readonly Animal[] = ANIMALS.filter((a) => a.hasSound);

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (verbatim from letter-land/utils/generate.ts)
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
// Array helpers
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle — returns a new array, does not mutate. */
export function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick a random element from an array. */
export function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ---------------------------------------------------------------------------
// assembleChoices
// ---------------------------------------------------------------------------

/**
 * Build a choice set for `target`.
 *
 * Exactly one correct entry (`target`); the remaining `CHOICES_PER_ROUND - 1`
 * are distinct distractors drawn from `pool` (excluding `target`, matched by
 * `id`). The final array is shuffled deterministically from `seed`, so
 * `correctIndex` is the post-shuffle position of `target`.
 *
 * If `pool` is too small to supply enough distinct distractors, the row is
 * shorter than `CHOICES_PER_ROUND` (it still contains exactly one `target`).
 */
export function assembleChoices(
  target: Animal,
  pool: readonly Animal[],
  seed: number,
): { choices: readonly Animal[]; correctIndex: number } {
  const rand = mulberry32(seed);

  // Candidate distractors: everything in the pool that isn't the target.
  const candidates = pool.filter((a) => a.id !== target.id);
  const neededDistractors = Math.max(0, CHOICES_PER_ROUND - 1);
  const distractors = shuffled(candidates, rand).slice(0, neededDistractors);

  // Combine + shuffle so the target lands at a deterministic random position.
  const choices = shuffled([target, ...distractors], rand);
  const correctIndex = choices.findIndex((a) => a.id === target.id);

  return { choices, correctIndex };
}

// ---------------------------------------------------------------------------
// buildRound
// ---------------------------------------------------------------------------

/** Positive (floored) modulo so non-positive levels still map in-range. */
function posMod(n: number, len: number): number {
  return ((n % len) + len) % len;
}

/**
 * Build the round for a 1-based `level`.
 *
 * The mode alternates by parity (`modeForLevel`):
 *   • hearName   — target walks ALL animals in order
 *                  (`ANIMALS[(level - 1) % ANIMALS.length]`); choices from ALL.
 *   • whichSound — target walks the sound-bearing subset in order
 *                  (`SOUND_ANIMALS[(level - 1) % SOUND_ANIMALS.length]`);
 *                  choices ALSO from `SOUND_ANIMALS` only, so every option
 *                  could plausibly make a sound and cow never appears.
 *
 * The order-walk uses a positive (floored) modulo so out-of-range levels —
 * including non-positive ones the source contract must tolerate without
 * throwing — still map to a valid in-pool target. For host-reachable levels
 * (>= 1) this is identical to a plain `%`.
 */
export function buildRound(level: number, seed: number): Round {
  const mode = modeForLevel(level);

  if (mode === 'whichSound') {
    const pool = SOUND_ANIMALS;
    const target = pool[posMod(level - 1, pool.length)];
    const { choices, correctIndex } = assembleChoices(target, pool, seed);
    return { mode: 'whichSound', target, choices, correctIndex };
  }

  // hearName — target + choices may come from the full inventory.
  const pool = ANIMALS;
  const target = pool[posMod(level - 1, pool.length)];
  const { choices, correctIndex } = assembleChoices(target, pool, seed);
  return { mode: 'hearName', target, choices, correctIndex };
}
