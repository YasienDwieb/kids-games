/**
 * Player level — derived from lifetime stars, never stored, so it can't drift
 * from the rewards it's built on. Each level costs a little more than the last
 * (L1→L2 costs 5 stars, L2→L3 costs 6, …): early levels come quickly, later
 * ones still arrive every few sessions.
 */

const costOf = (level: number) => 4 + level;

/** Lifetime stars needed to reach `level` (level 1 = 0 stars). */
export function starsForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += costOf(l);
  return total;
}

export type LevelInfo = {
  level: number;
  /** Stars earned inside the current level. */
  into: number;
  /** Stars the current level costs in total. */
  span: number;
  /** 0..1 toward the next level. */
  progress: number;
};

export function levelInfo(stars: number): LevelInfo {
  let level = 1;
  let floor = 0;
  while (stars >= floor + costOf(level)) {
    floor += costOf(level);
    level += 1;
  }
  const span = costOf(level);
  const into = Math.max(0, stars - floor);
  return { level, into, span, progress: into / span };
}
