/**
 * Match Up — level (round) builder.
 *
 * Pure; no React, no UI, no Math.random. Each game SESSION picks a random
 * sessionSeed at mount (the only Math.random call site, in index.tsx) and bakes
 * it into every buildLevel call, so the same level number yields fresh content
 * per session while staying deterministic for a fixed seed (tests pass seed = 0).
 *
 * Difficulty: theme rotates per level (consecutive levels differ); pair count
 * ramps 3 → 4 at level 5 (see pairCountForLevel). The bottom row is shuffled, so
 * `solution` is a permutation mapping each top item to its bottom partner index.
 */
import { levelsFromGenerator } from '@/sdk';
import type { LevelSource } from '@/sdk';
import { THEMES } from '../content';
import { pairCountForLevel, MAX_COUNT } from '../constants';
import type { MatchItem, RoundData } from '../types';

/** Stateful PRNG from a 32-bit seed (mulberry32 — same as the other games). */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates — returns a new array, does not mutate. */
function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build one round's data.
 *
 * seed = (level × 7919) XOR sessionSeed → deterministic per (level, session),
 * varied across sessions. sessionSeed defaults to 0 for tests.
 */
export function buildLevel(level: number, sessionSeed = 0): RoundData {
  const seed = (level * 7919) ^ (sessionSeed >>> 0);
  const rand = mulberry32(seed);

  const theme = THEMES[(level - 1) % THEMES.length];
  const count = pairCountForLevel(level);

  if (theme.kind === 'count') {
    // Pick `count` distinct numbers from 1..MAX_COUNT.
    const pool = Array.from({ length: MAX_COUNT }, (_, i) => i + 1);
    const numbers = shuffled(pool, rand).slice(0, count);
    // One emoji for the whole round so only the count varies between tiles.
    const emoji = shuffled(theme.emojis, rand)[0];

    const top: MatchItem[] = numbers.map((n) => ({ kind: 'number', n }));
    const bottomTagged = shuffled(
      numbers.map((n, topIdx) => ({ item: { kind: 'group', n, emoji } as MatchItem, topIdx })),
      rand,
    );
    const bottom: MatchItem[] = bottomTagged.map((b) => b.item);
    const solution: number[] = new Array(count);
    bottomTagged.forEach((b, bottomIdx) => {
      solution[b.topIdx] = bottomIdx;
    });

    return { themeId: theme.id, promptKey: theme.promptKey, top, bottom, solution };
  }

  // --- static pairs theme (unchanged behavior) ---
  const chosen = shuffled(theme.pairs, rand).slice(0, count);
  const top: MatchItem[] = chosen.map((p) => p.top);

  const bottomTagged = shuffled(
    chosen.map((p, topIdx) => ({ item: p.bottom, topIdx })),
    rand,
  );
  const bottom: MatchItem[] = bottomTagged.map((b) => b.item);

  const solution: number[] = new Array(count);
  bottomTagged.forEach((b, bottomIdx) => {
    solution[b.topIdx] = bottomIdx;
  });

  return { themeId: theme.id, promptKey: theme.promptKey, top, bottom, solution };
}

/**
 * Endless LevelSource randomized for the given sessionSeed. Call once per
 * session (useMemo in index.tsx). Pass sessionSeed = 0 in tests.
 */
export function makeMatchUpLevels(sessionSeed: number): LevelSource<RoundData> {
  return levelsFromGenerator((level) => buildLevel(level, sessionSeed));
}
