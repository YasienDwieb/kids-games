/**
 * Letter Land — levels.ts unit tests.
 *
 * Pure domain; deterministic given an order seed (per-level gen seed =
 * level × 7919). No UI, no React, no timers, no Math.random.
 *
 * Coverage:
 *   1. count === inventory length (finite source) for both ladders
 *   2. get(1) & get(count) valid & solvable
 *   3. Structural validity sweep over the whole finite range
 *   4. Random order: the ladder covers every letter exactly once
 *   5. Determinism: same order seed ⇒ identical ladders; different seeds ⇒
 *      different walk order
 *   6. get(out-of-range) does not throw (host clamps via count/isLast)
 */

import { makeLetterLandLevels } from '../utils/levels';
import { LATIN_LETTERS, ARABIC_LETTERS, CHOICES_PER_ROUND } from '../constants';
import type { Letter, LevelData } from '../types';

const SEED = 12345;

function assertLevelValid(data: LevelData, pool: readonly Letter[]): void {
  expect(data.level).toBeGreaterThanOrEqual(1);
  expect(data.round).toBeDefined();

  const { choices, correctIndex, target } = data.round;

  // Target is from the pool.
  expect(pool.some((p) => p.id === target.id)).toBe(true);

  // Solvable: correctIndex points at the target.
  expect(correctIndex).toBeGreaterThanOrEqual(0);
  expect(correctIndex).toBeLessThan(choices.length);
  expect(choices[correctIndex].id).toBe(target.id);

  // Length is CHOICES_PER_ROUND when the pool can supply it.
  expect(choices).toHaveLength(Math.min(CHOICES_PER_ROUND, pool.length));

  // Exactly one correct; all distinct; distractors in pool & not the target.
  expect(choices.filter((l) => l.id === target.id)).toHaveLength(1);
  const ids = choices.map((l) => l.id);
  expect(new Set(ids).size).toBe(ids.length);
  choices
    .filter((_, i) => i !== correctIndex)
    .forEach((d) => {
      expect(d.id).not.toBe(target.id);
      expect(pool.some((p) => p.id === d.id)).toBe(true);
    });
}

const LADDERS = [
  { name: 'Latin', pool: LATIN_LETTERS },
  { name: 'Arabic', pool: ARABIC_LETTERS },
] as const;

describe.each(LADDERS)('$name ladder (finite, shuffled)', ({ pool }) => {
  const source = makeLetterLandLevels(pool, SEED);

  it('count equals the inventory length', () => {
    expect(source.count).toBe(pool.length);
  });

  it('get(1) and get(count) are valid & solvable', () => {
    assertLevelValid(source.get(1), pool);
    assertLevelValid(source.get(source.count as number), pool);
  });

  it('every level 1..count is valid & solvable', () => {
    const count = source.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      assertLevelValid(source.get(lvl), pool);
    }
  });

  it('covers every letter exactly once across the finite ladder', () => {
    const count = source.count as number;
    const ids = Array.from({ length: count }, (_, i) => source.get(i + 1).round.target.id);
    expect(new Set(ids).size).toBe(pool.length);
    expect(ids.slice().sort()).toEqual(pool.map((l) => l.id).slice().sort());
  });

  it('is stateless — repeated get(n) returns an identical level', () => {
    const count = source.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(source.get(lvl)).toEqual(source.get(lvl));
    }
  });

  it('get(out-of-range) does not throw', () => {
    for (const lvl of [0, -3, (source.count as number) + 1, 1000]) {
      expect(() => source.get(lvl)).not.toThrow();
    }
  });
});

describe('order seed', () => {
  it('same seed yields identical ladders', () => {
    const a = makeLetterLandLevels(LATIN_LETTERS, SEED);
    const b = makeLetterLandLevels(LATIN_LETTERS, SEED);
    for (let lvl = 1; lvl <= LATIN_LETTERS.length; lvl++) {
      expect(a.get(lvl)).toEqual(b.get(lvl));
    }
  });

  it('different seeds change the walk order', () => {
    const a = makeLetterLandLevels(LATIN_LETTERS, 1);
    const b = makeLetterLandLevels(LATIN_LETTERS, 2);
    const seqA = Array.from({ length: LATIN_LETTERS.length }, (_, i) => a.get(i + 1).round.target.id);
    const seqB = Array.from({ length: LATIN_LETTERS.length }, (_, i) => b.get(i + 1).round.target.id);
    expect(seqA).not.toEqual(seqB);
  });

  it('the walk is not the plain alphabetical order', () => {
    const src = makeLetterLandLevels(LATIN_LETTERS, SEED);
    const seq = Array.from({ length: LATIN_LETTERS.length }, (_, i) => src.get(i + 1).round.target.id);
    expect(seq).not.toEqual(LATIN_LETTERS.map((l) => l.id));
  });
});
