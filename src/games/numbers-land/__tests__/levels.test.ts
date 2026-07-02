/**
 * Numbers Land — levels.ts unit tests.
 *
 * Pure domain; deterministic given an order seed (per-level gen seed =
 * level × 7919). No UI, no React, no timers, no Math.random.
 */

import { makeNumbersLandLevels } from '../utils/levels';
import { NUMBERS, CHOICES_PER_ROUND } from '../constants';
import type { LevelData } from '../types';

const SEED = 4242;

function assertLevelValid(data: LevelData): void {
  const { choices, correctIndex, target } = data.round;
  expect(NUMBERS.some((n) => n.id === target.id)).toBe(true);
  expect(choices[correctIndex].id).toBe(target.id);
  expect(choices).toHaveLength(Math.min(CHOICES_PER_ROUND, NUMBERS.length));
  expect(choices.filter((c) => c.id === target.id)).toHaveLength(1);
  const ids = choices.map((c) => c.id);
  expect(new Set(ids).size).toBe(ids.length);
}

describe('Numbers Land ladder', () => {
  const source = makeNumbersLandLevels(SEED);

  it('count is 10 (1–10)', () => {
    expect(source.count).toBe(10);
    expect(NUMBERS.map((n) => n.glyph)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  it('every level 1..10 is valid & solvable', () => {
    for (let lvl = 1; lvl <= 10; lvl++) assertLevelValid(source.get(lvl));
  });

  it('covers every number exactly once across the ladder', () => {
    const ids = Array.from({ length: 10 }, (_, i) => source.get(i + 1).round.target.id);
    expect(new Set(ids).size).toBe(10);
    expect(ids.slice().sort()).toEqual(NUMBERS.map((n) => n.id).slice().sort());
  });

  it('hero count matches the digit', () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      const target = source.get(lvl).round.target;
      expect(target.count).toBe(Number(target.glyph));
    }
  });

  it('the walk is not the plain 1→10 order', () => {
    const seq = Array.from({ length: 10 }, (_, i) => source.get(i + 1).round.target.id);
    expect(seq).not.toEqual(NUMBERS.map((n) => n.id));
  });

  it('same seed is deterministic; different seeds differ', () => {
    const a = makeNumbersLandLevels(7);
    const b = makeNumbersLandLevels(7);
    const c = makeNumbersLandLevels(8);
    const seq = (s: ReturnType<typeof makeNumbersLandLevels>) =>
      Array.from({ length: 10 }, (_, i) => s.get(i + 1).round.target.id);
    expect(seq(a)).toEqual(seq(b));
    expect(seq(a)).not.toEqual(seq(c));
  });
});
