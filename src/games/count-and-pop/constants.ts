// Count & Pop — game constants. No raw hex; use ACCENTS/COLORS from @/sdk.
// No React imports; this file is consumed by the pure domain layer too.

import { ACCENTS, COLORS } from '@/sdk';
import type { RoundMode } from './types';

// ---------------------------------------------------------------------------
// Emoji pool — 8 clearly-countable, child-friendly single-object emoji
// ---------------------------------------------------------------------------

export const OBJECT_EMOJI: ReadonlyArray<string> = [
  '🍎', // apple
  '⭐', // star
  '🎈', // balloon
  '🐞', // ladybug
  '🍓', // strawberry
  '🚗', // car
  '🐟', // fish
  '🐱', // cat
] as const;

// ---------------------------------------------------------------------------
// Count range caps
// ---------------------------------------------------------------------------

/** Largest count / target used in any round. */
export const MAX_OBJECTS = 10;

/** Largest addend for the addition mode (each individual term). */
export const MAX_ADDEND = 6;

/** Largest sum allowed in the addition mode (a + b <= MAX_SUM). */
export const MAX_SUM = 12;

// ---------------------------------------------------------------------------
// Choice count ramp
// ---------------------------------------------------------------------------

/** Fewest numeral choices shown (easy levels). */
export const MIN_CHOICE_COUNT = 3;

/** Most numeral choices shown (hard levels). */
export const MAX_CHOICE_COUNT = 4;

// ---------------------------------------------------------------------------
// Mode rotation — 12 levels mapped to modes
// Ramp: L1–4 easy counting, L5–8 mid counting, L9–10 makeN, L11–12 addition
// (Still exported for backward-compat and existing tests; endless engine uses
// MODE_ROTATION_ENDLESS below.)
// ---------------------------------------------------------------------------

export const MODE_ROTATION: ReadonlyArray<RoundMode> = [
  'countThisMany', // 1
  'howMany',       // 2
  'countThisMany', // 3
  'howMany',       // 4
  'countThisMany', // 5
  'howMany',       // 6
  'countThisMany', // 7
  'howMany',       // 8
  'makeN',         // 9
  'makeN',         // 10
  'addition',      // 11
  'addition',      // 12
] as const;

/**
 * Endless mode rotation — 16-entry cycle used by the infinite engine.
 *
 * Designed so a kid playing for hours sees all four modes roughly equally
 * after the early "easy counting only" warm-up, while the per-level difficulty
 * bands (maxCountFor / choiceCountFor) supply the progression.
 *
 * Cycle pattern:
 *   Slots  1– 4  (easy band):   countThisMany × 2, howMany × 2
 *   Slots  5– 8  (mid band):    countThisMany, howMany, makeN, howMany
 *   Slots  9–12  (hard band):   countThisMany, makeN, howMany, addition
 *   Slots 13–16  (expert band): makeN, addition, countThisMany, addition
 *
 * After level 16 the cycle repeats with the next difficulty band's counts.
 */
export const MODE_ROTATION_ENDLESS: ReadonlyArray<RoundMode> = [
  'countThisMany', // 1
  'howMany',       // 2
  'countThisMany', // 3
  'howMany',       // 4
  'countThisMany', // 5
  'howMany',       // 6
  'makeN',         // 7
  'howMany',       // 8
  'countThisMany', // 9
  'makeN',         // 10
  'howMany',       // 11
  'addition',      // 12
  'makeN',         // 13
  'addition',      // 14
  'countThisMany', // 15
  'addition',      // 16
] as const;

// ---------------------------------------------------------------------------
// Count ranges per level band
// ---------------------------------------------------------------------------

/** Maximum target count for levels 1–4 (easy). */
export const EASY_MAX_COUNT = 5;

/** Maximum target count for levels 5–8 (mid). */
export const MID_MAX_COUNT = 10;

/** Minimum value for makeN "have" quantity. */
export const MAKE_N_MIN_HAVE = 1;

// ---------------------------------------------------------------------------
// Colour tokens (UI layer reference; constants file owns them centrally)
// ---------------------------------------------------------------------------

/** Accent colour for correct-answer highlights. */
export const CORRECT_COLOR = ACCENTS.green.base;

/** Colour for wrong-answer feedback. */
export const WRONG_COLOR = ACCENTS.coral.base;

/** Game background — warm canvas. */
export const BACKGROUND_COLOR = COLORS.canvas;
