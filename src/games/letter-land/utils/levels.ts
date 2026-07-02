/**
 * Letter Land — finite level ladders.
 *
 * One level per letter in the chosen inventory, walked in a per-run shuffled
 * order (random, not alphabetical) so the experience feels like a game. The
 * order is derived from a persisted seed (see makeOrderSeed) so a resumed run
 * keeps its order and only Start Over reshuffles.
 *
 * `useLevels` is finite (the source carries `count`), so `isLast` flips true on
 * the final letter and `advance()` clamps there. The per-level generation seed
 * is `level × 7919` (a prime): stable across app restarts, very different state
 * per level. No Math.random / Date.now / timers in this domain.
 */

import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import { buildRound, orderFor } from '@/games/_shared/listen-find';
import type { Letter, LevelData } from '../types';
import { CHOICES_PER_ROUND } from '../constants';

/**
 * Build a finite `LevelSource` for one letter inventory: exactly one level per
 * letter, walked in the shuffled order derived from `orderSeed`, so a
 * `letterSet.length`-level ladder covers every letter once and `isLast` is true
 * on the last.
 */
export function makeLetterLandLevels(
  letterSet: readonly Letter[],
  orderSeed: number,
): LevelSource<LevelData> {
  const order = orderFor(letterSet.length, orderSeed);
  return levelsFromGenerator(
    (level): LevelData => ({
      level,
      round: buildRound(letterSet, order, level, level * 7919, CHOICES_PER_ROUND),
    }),
    { count: letterSet.length },
  );
}
