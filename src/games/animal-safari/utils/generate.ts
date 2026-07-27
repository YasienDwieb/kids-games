/**
 * Animal Safari — deterministic round builders.
 *
 * All builders accept a `seed` so generation is fully deterministic and stable
 * across app restarts. Math.random(), Date.now(), and timers are never used.
 *
 * Two round modes alternate by level parity (see `modeForLevel`):
 *   • hearName   — target from `HEAR_TARGETS`; choices from ALL animals.
 *   • whichSound — target from `SOUND_TARGETS`; choices ONLY from the
 *                  sound-bearing subset (`SOUND_ANIMALS`), so cow never appears.
 *
 * The two TARGET pools are disjoint and walked by round ordinal, so one full
 * ladder targets each of the 12 animals exactly once, never twice in a row.
 */

import { ANIMALS, CHOICES_PER_ROUND, LEVEL_COUNT, modeForLevel } from '../constants';
import type { Animal, Round } from '../types';

// ---------------------------------------------------------------------------
// Sound-bearing subset — the only animals eligible for a whichSound round.
// ---------------------------------------------------------------------------

/** Every animal with a real audio clip (`hasSound`) — excludes cow. */
export const SOUND_ANIMALS: readonly Animal[] = ANIMALS.filter((a) => a.hasSound);

// ---------------------------------------------------------------------------
// Target pools — disjoint, one per mode.
// ---------------------------------------------------------------------------
//
// The modes alternate level-by-level, so they must draw TARGETS from disjoint
// pools. When both walked their own pool by `level - 1`, the differing pool
// lengths (12 vs 11) drifted into lockstep: the same animal was targeted on two
// consecutive levels, and five animals were never targeted at all.
//
// hearName takes the first half of the inventory (cow among them — with no clip
// it is the only mode that can target it); whichSound takes the sound-bearing
// animals left over. Each mode walks its own pool by ROUND ORDINAL
// (`floor((level - 1) / 2)`), so one ladder targets each animal exactly once.
//
// DISTRACTORS are unaffected — still drawn from the full per-mode pool
// (`ANIMALS` / `SOUND_ANIMALS`), so every animal keeps appearing as an option.

/** Targets eligible for a `hearName` round — the first half of the inventory. */
export const HEAR_TARGETS: readonly Animal[] = ANIMALS.slice(0, Math.ceil(LEVEL_COUNT / 2));

/** Targets eligible for a `whichSound` round — sound-bearing, none in HEAR_TARGETS. */
export const SOUND_TARGETS: readonly Animal[] = SOUND_ANIMALS.filter(
  (a) => !HEAR_TARGETS.some((h) => h.id === a.id),
);

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * The PRNG seed for a level's choice layout.
 *
 * `sessionSeed` is 0 for the standalone ladder (stable across app restarts,
 * reproducing the historical `level × 7919`); the guided flow passes its
 * per-journey seed so `reset()` genuinely reshuffles distractors and
 * correct-tile positions. It never affects WHICH animal is the target.
 */
export function seedForLevel(level: number, sessionSeed = 0): number {
  return (Math.imul(level, 7919) ^ sessionSeed) >>> 0;
}

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
 * The mode alternates by parity (`modeForLevel`). Each mode picks its TARGET
 * from its own disjoint pool, indexed by ROUND ORDINAL — how many rounds of
 * that mode have already been played — rather than by the raw level:
 *
 *   ordinal = floor((level - 1) / 2)
 *
 *   • hearName   — target = HEAR_TARGETS[ordinal];  choices from ALL animals.
 *   • whichSound — target = SOUND_TARGETS[ordinal]; choices from SOUND_ANIMALS
 *                  only, so every option could plausibly make a sound and cow
 *                  never appears.
 *
 * Because the pools are disjoint and each is at least as long as its half of
 * the ladder, one full ladder targets every animal exactly once, never twice in
 * a row. (Indexing both pools by `level - 1` was what produced back-to-back
 * repeats and left five animals unreachable.)
 *
 * The walk uses a positive (floored) modulo so out-of-range levels — including
 * non-positive ones the source contract must tolerate without throwing — still
 * map to a valid in-pool target.
 */
export function buildRound(level: number, seed: number): Round {
  const mode = modeForLevel(level);
  const ordinal = Math.floor((level - 1) / 2);

  if (mode === 'whichSound') {
    const target = SOUND_TARGETS[posMod(ordinal, SOUND_TARGETS.length)];
    const { choices, correctIndex } = assembleChoices(target, SOUND_ANIMALS, seed);
    return { mode: 'whichSound', target, choices, correctIndex };
  }

  // hearName — distractors may come from the full inventory (cow included).
  const target = HEAR_TARGETS[posMod(ordinal, HEAR_TARGETS.length)];
  const { choices, correctIndex } = assembleChoices(target, ANIMALS, seed);
  return { mode: 'hearName', target, choices, correctIndex };
}
