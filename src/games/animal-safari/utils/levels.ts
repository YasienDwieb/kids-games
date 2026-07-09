/**
 * Animal Safari — finite level ladder.
 *
 * A fixed ladder of 12 levels alternating hearName / whichSound rounds (see
 * `modeForLevel`). `useLevels` is finite (the source carries `count`), so
 * `isLast` flips true on the final level and `advance()` clamps there. The
 * per-level seed comes from `seedForLevel` (a prime multiple, matching
 * letter-land/shape-detective): stable across app restarts, very different
 * state per level. No Math.random / Date.now / timers in this domain.
 */

import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import type { LevelData, Round } from '../types';
import { buildRound, seedForLevel } from './generate';
import { LEVEL_COUNT } from '../constants';

export { LEVEL_COUNT };

// Module-const ladder → stable identity (safe to pass straight to useLevels).
export const animalSafariLevels: LevelSource<LevelData> = levelsFromGenerator(
  (level) => ({ level, round: buildRound(level, seedForLevel(level)) }),
  { count: LEVEL_COUNT },
);

/**
 * The round for guided-flow unit `i` (0-based), for a journey's `sessionSeed`.
 *
 * Unit `i` is level `i + 1`, so guided mode plays the same content ladder as
 * the standalone game. The session seed only varies the choice layout, so a
 * journey `reset()` reshuffles distractors and correct-tile positions rather
 * than replaying byte-identical rounds.
 */
export function roundForUnit(i: number, sessionSeed = 0): Round {
  const level = i + 1;
  return buildRound(level, seedForLevel(level, sessionSeed));
}
