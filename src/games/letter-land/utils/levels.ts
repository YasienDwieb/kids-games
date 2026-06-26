/**
 * Letter Land — finite level ladders.
 *
 * One level per letter in the chosen inventory. `useLevels` is finite (the
 * source carries `count`), so `isLast` flips true on the final letter and
 * `advance()` clamps there. The per-level seed is `level × 7919` (a prime),
 * matching shape-detective: stable across app restarts, very different state
 * per level. No Math.random / Date.now / timers in this domain.
 */

import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import type { Letter, LevelData } from '../types';
import { LATIN_LETTERS, ARABIC_LETTERS } from '../constants';
import { buildRound } from './generate';

/**
 * Build a finite `LevelSource` for one letter inventory: exactly one level per
 * letter, walked in order, so a `letterSet.length`-level ladder covers every
 * letter once and `isLast` is true on the last.
 */
export function makeLetterLandLevels(letterSet: readonly Letter[]): LevelSource<LevelData> {
  return levelsFromGenerator(
    (level) => ({ level, round: buildRound(letterSet, level, level * 7919) }),
    { count: letterSet.length },
  );
}

// Module-const ladders → stable identity (safe to pass straight to useLevels).
export const LATIN_LEVELS: LevelSource<LevelData> = makeLetterLandLevels(LATIN_LETTERS);
export const ARABIC_LEVELS: LevelSource<LevelData> = makeLetterLandLevels(ARABIC_LETTERS);
