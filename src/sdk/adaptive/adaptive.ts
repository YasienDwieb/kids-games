/**
 * Adaptive difficulty — a small per-game "skill tier" that follows the child.
 *
 *   tier −2 … +2   (0 = the game's normal curve)
 *
 * Two attempts lost in a row → one tier easier. Three wins in a row → one tier
 * harder. Each game decides what a tier means (slower falls, extra arrows, more
 * choices…). The first tier comes from the parent's age band, so a toddler
 * starts gentler and a big kid starts a notch harder.
 */
export const MIN_TIER = -2;
export const MAX_TIER = 2;
export const LOSSES_TO_EASE = 2;
export const WINS_TO_RAISE = 3;

export type AdaptiveState = { tier: number; wins: number; losses: number };

export function startingTier(ageBand: string | null | undefined): number {
  if (ageBand === 'toddler') return -1;
  if (ageBand === 'kids') return 1;
  return 0;
}

/** Apply one attempt's result. Streaks reset whenever the tier moves. */
export function nextAdaptive(s: AdaptiveState, won: boolean): AdaptiveState {
  if (won) {
    const wins = s.wins + 1;
    if (wins >= WINS_TO_RAISE && s.tier < MAX_TIER) return { tier: s.tier + 1, wins: 0, losses: 0 };
    return { tier: s.tier, wins, losses: 0 };
  }
  const losses = s.losses + 1;
  if (losses >= LOSSES_TO_EASE && s.tier > MIN_TIER) return { tier: s.tier - 1, wins: 0, losses: 0 };
  return { tier: s.tier, wins: 0, losses };
}

/** Map a tier onto a multiplier: `step` per tier around 1 (e.g. 0.1 → 0.8 … 1.2). */
export function tierFactor(tier: number, step: number): number {
  return 1 + tier * step;
}
