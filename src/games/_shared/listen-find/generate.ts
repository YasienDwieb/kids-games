/**
 * Shared listen-and-find — deterministic round builders.
 *
 * Generalized from letter-land's original generator: works over any `FindItem`
 * inventory (letters or digits). All builders accept a `seed` so generation is
 * fully deterministic and stable across app restarts. Math.random(), Date.now(),
 * and timers are never used here.
 */

import type { FindItem } from './types';

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32
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
 * Build a choice set for `target`: exactly one correct entry plus up to
 * `choicesPerRound - 1` distinct distractors drawn from `pool` (excluding
 * `target` by id), shuffled deterministically from `seed`. If `pool` is too
 * small, the row is shorter (it still contains exactly one `target`).
 */
export function assembleChoices<T extends FindItem>(
  target: T,
  pool: readonly T[],
  seed: number,
  choicesPerRound: number,
): { choices: readonly T[]; correctIndex: number } {
  const rand = mulberry32(seed);
  const candidates = pool.filter((l) => l.id !== target.id);
  const needed = Math.max(0, choicesPerRound - 1);
  const distractors = shuffled(candidates, rand).slice(0, needed);
  const choices = shuffled([target, ...distractors], rand);
  const correctIndex = choices.findIndex((l) => l.id === target.id);
  return { choices, correctIndex };
}

// ---------------------------------------------------------------------------
// orderFor / buildRound
// ---------------------------------------------------------------------------

/**
 * A per-run shuffled permutation of `[0..length)`. Used to walk an inventory in
 * random (but deterministic-per-seed) order so a finite ladder still covers
 * every item exactly once.
 */
export function orderFor(length: number, seed: number): number[] {
  return shuffled(
    Array.from({ length }, (_, i) => i),
    mulberry32(seed),
  );
}

/**
 * Build the round for a 1-based `level` by walking `order` over `inventory`.
 * The index uses a positive (floored) modulo so out-of-range levels — including
 * non-positive ones the source contract must tolerate — still map to a valid
 * in-inventory target.
 */
export function buildRound<T extends FindItem>(
  inventory: readonly T[],
  order: readonly number[],
  level: number,
  seed: number,
  choicesPerRound: number,
): { target: T; choices: readonly T[]; correctIndex: number } {
  const len = inventory.length;
  const pos = (((level - 1) % len) + len) % len;
  const target = inventory[order[pos]];
  const { choices, correctIndex } = assembleChoices(target, inventory, seed, choicesPerRound);
  return { target, choices, correctIndex };
}
