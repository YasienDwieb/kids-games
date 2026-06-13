import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import type { LevelData, PuzzleType } from '../types';
import { MIN_OPTION_COUNT, MAX_OPTION_COUNT } from '../constants';
import {
  buildPatternPuzzle,
  buildOddOneOutPuzzle,
  buildSortPuzzle,
} from './generate';

export const TOTAL_LEVELS = 12;

// Puzzle-type rotation across levels.  Sort is introduced at level 5 to give
// kids a chance to learn pattern + odd-one-out first.
const TYPE_ROTATION: PuzzleType[] = [
  'pattern',      // 1
  'oddOneOut',    // 2
  'pattern',      // 3
  'oddOneOut',    // 4
  'sort',         // 5
  'pattern',      // 6
  'oddOneOut',    // 7
  'sort',         // 8
  'pattern',      // 9
  'oddOneOut',    // 10
  'sort',         // 11
  'pattern',      // 12
];

/**
 * Determine which attributes are "active" for a given level.
 * Difficulty ramps: kind-only → kind+color → kind+color+size.
 */
function activeAttributesFor(level: number): ReadonlyArray<'kind' | 'color' | 'size'> {
  if (level <= 4) return ['kind'] as const;
  if (level <= 8) return ['kind', 'color'] as const;
  return ['kind', 'color', 'size'] as const;
}

/**
 * Number of tap / sort options to show.
 * Grows linearly from MIN_OPTION_COUNT at level 1 to MAX_OPTION_COUNT at
 * TOTAL_LEVELS to keep early levels manageable.
 */
function optionCountFor(level: number): number {
  const t = TOTAL_LEVELS > 1 ? (level - 1) / (TOTAL_LEVELS - 1) : 0; // 0..1
  return Math.round(MIN_OPTION_COUNT + t * (MAX_OPTION_COUNT - MIN_OPTION_COUNT));
}

/**
 * Build one level's data.
 * Seed = level × 7919 (a prime) keeps generation stable across app restarts
 * while giving very different starting states per level.
 */
export function buildLevel(level: number): LevelData {
  const seed = level * 7919;
  const activeAttributes = activeAttributesFor(level);
  const optionCount = optionCountFor(level);
  const puzzleType = TYPE_ROTATION[(level - 1) % TYPE_ROTATION.length];

  let puzzle: LevelData['puzzle'];

  if (puzzleType === 'pattern') {
    puzzle = buildPatternPuzzle(seed, activeAttributes, optionCount);
  } else if (puzzleType === 'oddOneOut') {
    // itemCount = optionCount (same pool size semantics)
    puzzle = buildOddOneOutPuzzle(seed, activeAttributes, optionCount);
  } else {
    // Sort: item count grows slightly faster than options (more to drag)
    const itemCount = optionCount + 1;
    puzzle = buildSortPuzzle(seed, activeAttributes, itemCount);
  }

  return { level, activeAttributes, optionCount, puzzle };
}

/** LevelSource for useLevels — finite, 12 levels. */
export const shapeDetectiveLevels: LevelSource<LevelData> = levelsFromGenerator(buildLevel, {
  count: TOTAL_LEVELS,
});
