/**
 * Letter Land — deterministic round builders.
 *
 * All builders accept a `seed` so generation is fully deterministic and stable
 * across app restarts. Math.random(), Date.now(), and timers are never used.
 */

import { CHOICES_PER_ROUND } from '../constants';
import type { Letter, Round } from '../types';

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (verbatim from count-and-pop/utils/generate.ts)
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
// Array helpers (shape copied from count-and-pop/utils/generate.ts)
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
 * Build a `hearAndFind` choice set for `target`.
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
  target: Letter,
  pool: readonly Letter[],
  seed: number,
): { choices: readonly Letter[]; correctIndex: number } {
  const rand = mulberry32(seed);

  // Candidate distractors: everything in the pool that isn't the target.
  const candidates = pool.filter((l) => l.id !== target.id);
  const neededDistractors = Math.max(0, CHOICES_PER_ROUND - 1);
  const distractors = shuffled(candidates, rand).slice(0, neededDistractors);

  // Combine + shuffle so the target lands at a deterministic random position.
  const choices = shuffled([target, ...distractors], rand);
  const correctIndex = choices.findIndex((l) => l.id === target.id);

  return { choices, correctIndex };
}

// ---------------------------------------------------------------------------
// buildRound
// ---------------------------------------------------------------------------

/**
 * Build the round for a 1-based `level`.
 *
 * Every round is `hearAndFind`. The target letter walks the set in order:
 * `letterSet[(level - 1) % length]`, so a finite ladder of `length` levels
 * covers every letter exactly once. The index uses a positive (floored) modulo
 * so out-of-range levels — including non-positive ones the source contract must
 * tolerate without throwing — still map to a valid in-set target. For host-
 * reachable levels (>= 1) this is identical to a plain `%`.
 */
export function buildRound(
  letterSet: readonly Letter[],
  level: number,
  seed: number,
): Round {
  const len = letterSet.length;
  const idx = (((level - 1) % len) + len) % len;
  const target = letterSet[idx];
  const { choices, correctIndex } = assembleChoices(target, letterSet, seed);
  return { mode: 'hearAndFind', target, choices, correctIndex };
}
