/**
 * Shared hint policy — how a game answers repeated mistakes on one round.
 *
 *   1st miss → 'retry'     : gentle "try again", nothing revealed
 *   2nd miss → 'highlight' : point at the answer (pulse / glow), child still taps it
 *   3rd miss → 'reveal'    : show the answer outright so nobody gets stuck
 *
 * Stars reward the first try, so a revealed answer still completes the round
 * but doesn't earn the same praise as a clean solve.
 */
export type HintStep = 'retry' | 'highlight' | 'reveal';

/** Which hint to give after `misses` wrong attempts (misses ≥ 1). */
export function hintStepFor(misses: number): HintStep {
  if (misses <= 1) return 'retry';
  if (misses === 2) return 'highlight';
  return 'reveal';
}

/** 3★ for a first-try solve, 2★ after one miss, 1★ otherwise. */
export function starsForMisses(misses: number): 1 | 2 | 3 {
  if (misses <= 0) return 3;
  if (misses === 1) return 2;
  return 1;
}
