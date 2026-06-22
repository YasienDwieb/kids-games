/**
 * Match Up — level builder unit tests.
 * Pure domain; no UI, no React, no timers, no Math.random.
 */
import { buildLevel } from '../utils/levels';
import { THEMES } from '../content';
import { TOTAL_LEVELS, pairCountForLevel } from '../constants';
import type { MatchItem } from '../types';

const keyOf = (it: MatchItem): string =>
  it.kind === 'emoji' ? `e:${it.emoji}` : `c:${it.color}`;

// Is (top, bottom) a real pair in the given theme?
function isRealPair(themeId: string, top: MatchItem, bottom: MatchItem): boolean {
  const theme = THEMES.find((th) => th.id === themeId)!;
  return theme.pairs.some(
    (p) => keyOf(p.top) === keyOf(top) && keyOf(p.bottom) === keyOf(bottom),
  );
}

describe('buildLevel', () => {
  it('is deterministic for the same level + seed', () => {
    expect(buildLevel(3, 0)).toEqual(buildLevel(3, 0));
    expect(buildLevel(5, 99)).toEqual(buildLevel(5, 99));
  });

  it('ramps from 3 pairs (≤ L4) to 4 pairs (≥ L5)', () => {
    expect(buildLevel(1, 0).top).toHaveLength(3);
    expect(buildLevel(4, 0).top).toHaveLength(3);
    expect(buildLevel(5, 0).top).toHaveLength(4);
    expect(buildLevel(8, 0).top).toHaveLength(4);
  });

  it('honors pairCountForLevel for every level', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const r = buildLevel(lvl, 0);
      const n = pairCountForLevel(lvl);
      expect(r.top).toHaveLength(n);
      expect(r.bottom).toHaveLength(n);
      expect(r.solution).toHaveLength(n);
    }
  });

  it('produces a solution that is a permutation of bottom indices', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const { solution, bottom } = buildLevel(lvl, 7);
      const sorted = [...solution].sort((a, b) => a - b);
      expect(sorted).toEqual(bottom.map((_, i) => i));
    }
  });

  it('every (top[i], bottom[solution[i]]) is a real themed pair', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const r = buildLevel(lvl, 13);
      r.top.forEach((top, i) => {
        const partner = r.bottom[r.solution[i]];
        expect(isRealPair(r.themeId, top, partner)).toBe(true);
      });
    }
  });

  it('uses distinct top items within a round (no duplicate pairs)', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const tops = buildLevel(lvl, 3).top.map(keyOf);
      expect(new Set(tops).size).toBe(tops.length);
    }
  });

  it('rotates the theme so consecutive levels differ', () => {
    expect(buildLevel(1, 0).themeId).not.toBe(buildLevel(2, 0).themeId);
    expect(buildLevel(2, 0).themeId).not.toBe(buildLevel(3, 0).themeId);
  });

  it('only references existing theme ids', () => {
    const ids = new Set(THEMES.map((t) => t.id));
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      expect(ids.has(buildLevel(lvl, 0).themeId)).toBe(true);
    }
  });
});
