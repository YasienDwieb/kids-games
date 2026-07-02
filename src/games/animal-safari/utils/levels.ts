/**
 * Animal Safari — finite level ladder.
 *
 * A fixed ladder of 12 levels alternating hearName / whichSound rounds (see
 * `modeForLevel`). `useLevels` is finite (the source carries `count`), so
 * `isLast` flips true on the final level and `advance()` clamps there. The
 * per-level seed is `level × 7919` (a prime), matching letter-land/shape-
 * detective: stable across app restarts, very different state per level. No
 * Math.random / Date.now / timers in this domain.
 */

import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import type { LevelData } from '../types';
import { buildRound } from './generate';

/** Total levels in the finite ladder. */
export const LEVEL_COUNT = 12;

// Module-const ladder → stable identity (safe to pass straight to useLevels).
export const animalSafariLevels: LevelSource<LevelData> = levelsFromGenerator(
  (level) => ({ level, round: buildRound(level, level * 7919) }),
  { count: LEVEL_COUNT },
);
