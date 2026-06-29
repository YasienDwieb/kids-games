/**
 * Numbers Land — finite level ladder.
 *
 * One level per number (1–10), walked in a per-run shuffled order derived from
 * a persisted seed (random, not 1→10) so it feels like a game; Start Over
 * reshuffles. Generation is deterministic (level × 7919). No Math.random /
 * Date.now / timers in this domain.
 */

import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import { buildRound, orderFor } from '@/games/_shared/listen-find';
import type { LevelData } from '../types';
import { NUMBERS, CHOICES_PER_ROUND } from '../constants';

export function makeNumbersLandLevels(orderSeed: number): LevelSource<LevelData> {
  const order = orderFor(NUMBERS.length, orderSeed);
  return levelsFromGenerator(
    (level): LevelData => ({
      level,
      round: buildRound(NUMBERS, order, level, level * 7919, CHOICES_PER_ROUND),
    }),
    { count: NUMBERS.length },
  );
}
