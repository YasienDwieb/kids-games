/**
 * Count & Pop — deterministic round builders.
 *
 * All builders accept a `seed` so tests are fully deterministic.
 * Math.random(), Date.now(), and timers are never used here.
 */

import { OBJECT_EMOJI, MAX_OBJECTS, MAX_ADDEND, MAX_SUM } from '../constants';
import type {
  CountThisManyRound,
  HowManyRound,
  MakeNRound,
  AdditionRound,
} from '../types';

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (verbatim from shape-detective/utils/generate.ts)
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
// Array helpers (verbatim from shape-detective/utils/generate.ts)
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle — returns a new array, does not mutate. */
function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick a random element from an array. */
function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/** Pick an element at a specific index modulo length (safe wrap). */
function at<T>(arr: readonly T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

// ---------------------------------------------------------------------------
// Distractor helpers
// ---------------------------------------------------------------------------

/**
 * Build up to `choiceCount - 1` plausible distractor numbers around `correct`.
 * All values are distinct, non-negative, within [minVal, maxVal].
 * Distractors are biased toward ±1 / ±2 of `correct` for plausibility.
 * Falls back to any unused value in range if neighbourhood is exhausted.
 *
 * Returns fewer than requested when the range is too small to provide enough
 * unique values (e.g. range [0,2] can only yield 2 distractors max).
 */
function buildDistractors(
  seed: number,
  correct: number,
  choiceCount: number,
  minVal: number,
  maxVal: number,
): number[] {
  // Cap needed to the number of values available in the range excluding `correct`
  const rangeSize = maxVal - minVal + 1;
  const maxPossibleDistractors = Math.max(0, rangeSize - 1);
  const needed = Math.min(choiceCount - 1, maxPossibleDistractors);

  const distractors: number[] = [];

  // Candidate offsets: prefer plausible neighbours ±1, ±2, then wider range
  const nearOffsets = [-1, 1, -2, 2, -3, 3];
  let attemptSeed = seed + 1000;

  while (distractors.length < needed) {
    const dRand = mulberry32(attemptSeed++);

    let candidate: number;

    // Try a near-offset first, then fall back to a random in-range value
    const attemptIndex = attemptSeed - (seed + 1001);
    if (attemptIndex >= 0 && attemptIndex < nearOffsets.length) {
      const offset = nearOffsets[attemptIndex];
      candidate = correct + offset;
    } else {
      // Random integer in [minVal, maxVal]
      candidate = minVal + Math.floor(dRand() * (maxVal - minVal + 1));
    }

    // Clamp to valid range
    candidate = Math.max(minVal, Math.min(maxVal, candidate));

    // Reject if duplicate of correct or existing distractor
    if (candidate !== correct && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }

    // Safety fallback: sweep the full range sequentially
    if (attemptSeed > seed + 10000) {
      for (let v = minVal; v <= maxVal && distractors.length < needed; v++) {
        if (v !== correct && !distractors.includes(v)) {
          distractors.push(v);
        }
      }
      break;
    }
  }

  return distractors;
}

/**
 * Assemble a choices array by inserting `correct` at a random position
 * among `distractors`, returning both the final choices and the correctIndex.
 */
function assembleChoices(
  correct: number,
  distractors: number[],
  rand: () => number,
): { choices: number[]; correctIndex: number } {
  const choiceCount = distractors.length + 1;
  const correctIndex = Math.floor(rand() * choiceCount);
  const choices = [...distractors];
  choices.splice(correctIndex, 0, correct);
  return { choices, correctIndex };
}

// ---------------------------------------------------------------------------
// buildCountThisMany
// ---------------------------------------------------------------------------

/**
 * Builds a countThisMany round.
 * The player pops exactly `target` objects from a field of tiles.
 * `target` is validated to be in [1, MAX_OBJECTS].
 */
export function buildCountThisMany(seed: number, target: number): CountThisManyRound {
  const rand = mulberry32(seed);
  const clampedTarget = Math.max(1, Math.min(MAX_OBJECTS, target));
  const objectEmoji = pick(OBJECT_EMOJI, rand);
  return {
    mode: 'countThisMany',
    target: clampedTarget,
    objectEmoji,
  };
}

// ---------------------------------------------------------------------------
// buildHowMany
// ---------------------------------------------------------------------------

/**
 * Builds a howMany round.
 * `count` objects are shown; player picks the matching numeral.
 * Choices are distinct, plausible (±1/±2), all in [1, MAX_OBJECTS], never negative.
 */
export function buildHowMany(
  seed: number,
  count: number,
  choiceCount: number,
): HowManyRound {
  const rand = mulberry32(seed);
  const objectEmoji = pick(OBJECT_EMOJI, rand);

  const clampedCount = Math.max(1, Math.min(MAX_OBJECTS, count));
  const distractors = buildDistractors(seed, clampedCount, choiceCount, 1, MAX_OBJECTS);
  const { choices, correctIndex } = assembleChoices(clampedCount, distractors, rand);

  return {
    mode: 'howMany',
    count: clampedCount,
    objectEmoji,
    choices,
    correctIndex,
  };
}

// ---------------------------------------------------------------------------
// buildMakeN
// ---------------------------------------------------------------------------

/**
 * Builds a makeN round.
 * Player sees `have` objects and chooses how many MORE to add to reach `target`.
 * Correct answer = target − have (always >= 1).
 * Distractors are in [0, target], never negative.
 */
export function buildMakeN(
  seed: number,
  have: number,
  target: number,
  choiceCount: number,
): MakeNRound {
  const rand = mulberry32(seed);
  const objectEmoji = pick(OBJECT_EMOJI, rand);

  const clampedHave = Math.max(0, Math.min(target - 1, have)); // have < target always
  const clampedTarget = Math.max(clampedHave + 1, target);
  const correct = clampedTarget - clampedHave; // >= 1

  // Choices: how many more to add → range [0, target] (0 is valid as a distractor)
  const distractors = buildDistractors(seed, correct, choiceCount, 0, clampedTarget);
  const { choices, correctIndex } = assembleChoices(correct, distractors, rand);

  return {
    mode: 'makeN',
    have: clampedHave,
    target: clampedTarget,
    objectEmoji,
    choices,
    correctIndex,
  };
}

// ---------------------------------------------------------------------------
// buildAddition
// ---------------------------------------------------------------------------

/**
 * Builds an addition round.
 * Player sees group A (a objects) and group B (b objects), picks their sum.
 * Correct answer = a + b.
 * Choices are distinct, non-negative, capped at MAX_SUM.
 */
export function buildAddition(
  seed: number,
  a: number,
  b: number,
  choiceCount: number,
): AdditionRound {
  const rand = mulberry32(seed);
  const objectEmoji = pick(OBJECT_EMOJI, rand);

  const clampedA = Math.max(0, Math.min(MAX_ADDEND, a));
  const clampedB = Math.max(0, Math.min(MAX_ADDEND, b));
  const correct = clampedA + clampedB; // 0 .. MAX_SUM

  // Distractors in [0, MAX_SUM], never negative
  const distractors = buildDistractors(seed, correct, choiceCount, 0, MAX_SUM);
  const { choices, correctIndex } = assembleChoices(correct, distractors, rand);

  return {
    mode: 'addition',
    a: clampedA,
    b: clampedB,
    objectEmoji,
    choices,
    correctIndex,
  };
}
