/**
 * Count & Pop — level definitions.
 * Pure; no React, no UI, no Math.random.
 */

import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import type { LevelData, RoundMode } from '../types';
import {
  MODE_ROTATION,
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

export const TOTAL_LEVELS = 12;

// ---------------------------------------------------------------------------
// Difficulty helpers
// ---------------------------------------------------------------------------

/**
 * Number of numeral choices shown to the player.
 * Grows linearly from MIN_CHOICE_COUNT at level 1 to MAX_CHOICE_COUNT at
 * TOTAL_LEVELS to keep early levels manageable.
 */
function choiceCountFor(level: number): number {
  const t = TOTAL_LEVELS > 1 ? (level - 1) / (TOTAL_LEVELS - 1) : 0; // 0..1
  return Math.round(MIN_CHOICE_COUNT + t * (MAX_CHOICE_COUNT - MIN_CHOICE_COUNT));
}

/**
 * Upper bound on the count / target for a given level.
 * L1–4: 1–5, L5–12: 1–10.
 */
function maxCountFor(level: number): number {
  return level <= 4 ? EASY_MAX_COUNT : MID_MAX_COUNT;
}

/**
 * Deterministic count target for a given level.
 * Interpolates linearly from 1 to maxCount using a stable formula.
 */
function targetFor(level: number): number {
  const maxCount = maxCountFor(level);
  // Spread targets across the full range; use modular placement for variety
  // Formula: 1 + ((level - 1) * 3) % maxCount   — gives varied non-monotone targets
  return 1 + ((level - 1) * 3) % maxCount;
}

/**
 * Derive addends (a, b) for addition mode from the level seed.
 * Uses a deterministic spread: a iterates 1..MAX_ADDEND, b fills the rest.
 */
function additionParamsFor(level: number): { a: number; b: number } {
  // Stable spread: vary a via level index, keep sum <= MAX_ADDEND * 1.5
  const a = 1 + ((level - 1) % MAX_ADDEND);
  const b = 1 + ((level) % MAX_ADDEND);
  return { a, b };
}

// ---------------------------------------------------------------------------
// buildLevel
// ---------------------------------------------------------------------------

/**
 * Build one level's data.
 * Seed = level × 7919 (a prime) for per-level uniqueness and stability.
 */
export function buildLevel(level: number): LevelData {
  const seed = level * 7919;
  const mode: RoundMode = MODE_ROTATION[(level - 1) % MODE_ROTATION.length];
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

/** LevelSource for useLevels — finite, 12 levels. */
export const countAndPopLevels: LevelSource<LevelData> = levelsFromGenerator(buildLevel, {
  count: TOTAL_LEVELS,
});
