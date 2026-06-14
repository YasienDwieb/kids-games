/**
 * Count & Pop — level definitions.
 *
 * Pure; no React, no UI, no Math.random.
 *
 * Session-seed design
 * -------------------
 * Each GAME SESSION receives a random salt (sessionSeed) chosen at mount time
 * in index.tsx — the ONLY call site that uses Math.random(). That salt is
 * passed into makeCountAndPopLevels(sessionSeed), which bakes it into every
 * buildLevel call so that the same level number produces unique content per
 * session while remaining fully deterministic for a fixed sessionSeed.
 *
 * Tests always pass sessionSeed = 0 so they stay deterministic.
 *
 * Difficulty bands (endless)
 * --------------------------
 * Levels are grouped into repeating 16-level cycles (MODE_ROTATION_ENDLESS).
 * Within each cycle the count/target caps ramp up across four bands:
 *
 *   Band 1  (lvl  1– 4)  — counts 1–5,  choices 3,  modes: countThisMany + howMany
 *   Band 2  (lvl  5– 8)  — counts 1–10, choices 3,  modes: countThisMany + howMany + makeN
 *   Band 3  (lvl  9–12)  — counts 1–10, choices 4,  modes: all four
 *   Band 4  (lvl 13–16)  — counts 1–10, choices 4,  modes: makeN + addition dominant
 *   Band 5+ (lvl 17+)    — same caps (MAX_OBJECTS/MAX_SUM hard limits keep the game
 *                          visually sane for ages 3–7); difficulty variety comes from
 *                          the mode mix + per-session randomization of values, NOT
 *                          ever-growing numbers.
 *
 * The modulo on MODE_ROTATION_ENDLESS ensures levels 17, 33, 49 … map to the
 * same mode slot as 1, 17, 33 … within the 16-entry cycle.
 */

import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import type { LevelData, RoundMode } from '../types';
import {
  MODE_ROTATION,
  MODE_ROTATION_ENDLESS,
  MIN_CHOICE_COUNT,
  MAX_CHOICE_COUNT,
  EASY_MAX_COUNT,
  MID_MAX_COUNT,
  MAKE_N_MIN_HAVE,
  MAX_ADDEND,
} from '../constants';
import {
  buildCountThisMany,
  buildHowMany,
  buildMakeN,
  buildAddition,
} from './generate';

// ---------------------------------------------------------------------------
// Legacy constant — kept for existing tests that import it directly.
// ---------------------------------------------------------------------------

/** @deprecated Use makeCountAndPopLevels() for all new call sites. */
export const TOTAL_LEVELS = 12;

// ---------------------------------------------------------------------------
// Difficulty helpers (endless)
// ---------------------------------------------------------------------------

/**
 * Number of numeral choices shown to the player.
 *
 * Ramps from MIN_CHOICE_COUNT (3) to MAX_CHOICE_COUNT (4) over the first
 * 8 levels, then stays at MAX_CHOICE_COUNT forever.
 */
function choiceCountFor(level: number): number {
  if (level >= 9) return MAX_CHOICE_COUNT;
  // Linear ramp over levels 1–8
  const t = (level - 1) / 7; // 0..1
  return Math.round(MIN_CHOICE_COUNT + t * (MAX_CHOICE_COUNT - MIN_CHOICE_COUNT));
}

/**
 * Upper bound on the count / target for a given level.
 *
 * Difficulty bands (keep counts within MAX_OBJECTS so visuals stay sane):
 *   Level  1– 4  → 1–5   (easy, toddler-friendly)
 *   Level  5+    → 1–10  (full range, stays there forever)
 */
function maxCountFor(level: number): number {
  if (level <= 4) return EASY_MAX_COUNT;   // 5
  return MID_MAX_COUNT;                    // 10 — capped at MAX_OBJECTS
}

/**
 * Deterministic count target for a given level.
 *
 * Uses a non-monotone modulo spread so targets vary nicely across levels
 * without ever growing beyond maxCountFor(level).
 * Formula: 1 + ((level - 1) * 3) % maxCount
 */
function targetFor(level: number): number {
  const maxCount = maxCountFor(level);
  return 1 + ((level - 1) * 3) % maxCount;
}

/**
 * Derive addends (a, b) for addition mode from the level index.
 *
 * Cycles through combinations deterministically; both stay within MAX_ADDEND
 * so the builder's clamp never silently discards the intended difficulty.
 */
function additionParamsFor(level: number): { a: number; b: number } {
  const a = 1 + ((level - 1) % MAX_ADDEND);
  const b = 1 + (level % MAX_ADDEND);
  return { a, b };
}

// ---------------------------------------------------------------------------
// buildLevel
// ---------------------------------------------------------------------------

/**
 * Build one level's data.
 *
 * The combined seed = (level × 7919) XOR sessionSeed ensures:
 *   - Same level + same sessionSeed  →  identical output (determinism).
 *   - Same level + different sessionSeed  →  different output (per-session variety).
 *   - sessionSeed defaults to 0 so legacy call sites (and tests) remain unchanged.
 *
 * NOTE: Math.random is NEVER called here. Only the call site in index.tsx that
 * creates the sessionSeed may use Math.random — document this at that call site.
 */
export function buildLevel(level: number, sessionSeed = 0): LevelData {
  // XOR-combine level hash with sessionSeed for per-session variety.
  const seed = (level * 7919) ^ (sessionSeed >>> 0);
  const mode: RoundMode = MODE_ROTATION_ENDLESS[(level - 1) % MODE_ROTATION_ENDLESS.length];
  const choiceCount = choiceCountFor(level);
  const target = targetFor(level);

  switch (mode) {
    case 'countThisMany': {
      const round = buildCountThisMany(seed, target);
      return { level, mode, round };
    }

    case 'howMany': {
      const round = buildHowMany(seed, target, choiceCount);
      return { level, mode, round };
    }

    case 'makeN': {
      // have is deterministic: MAKE_N_MIN_HAVE + offset derived from level
      const have = MAKE_N_MIN_HAVE + ((level - 1) % (target - 1 || 1));
      const round = buildMakeN(seed, have, target, choiceCount);
      return { level, mode, round };
    }

    case 'addition': {
      const { a, b } = additionParamsFor(level);
      const round = buildAddition(seed, a, b, choiceCount);
      return { level, mode, round };
    }
  }
}

// ---------------------------------------------------------------------------
// LevelSource factories
// ---------------------------------------------------------------------------

/**
 * Create an ENDLESS LevelSource whose rounds are randomized for the given
 * sessionSeed.
 *
 * Call this ONCE per game session (useMemo([]) in index.tsx). The returned
 * source.count is undefined, so useLevels treats the game as endless
 * (isLast is always false; advance() increments level without clamping).
 *
 * Pass sessionSeed = 0 in tests for fully deterministic behavior.
 */
export function makeCountAndPopLevels(sessionSeed: number): LevelSource<LevelData> {
  return levelsFromGenerator((level) => buildLevel(level, sessionSeed));
}

/**
 * Default endless source with sessionSeed = 0.
 *
 * Exported so that game code that does not yet need per-session randomization
 * can import a ready-made source. Prefer makeCountAndPopLevels(sessionSeed)
 * when randomization is required (i.e., always in production).
 *
 * @deprecated Kept for backward-compat with existing tests. Use
 * makeCountAndPopLevels() in production code.
 */
export const countAndPopLevels: LevelSource<LevelData> = makeCountAndPopLevels(0);

// ---------------------------------------------------------------------------
// Re-export MODE_ROTATION for tests that assert on mode patterns.
// ---------------------------------------------------------------------------
export { MODE_ROTATION };
