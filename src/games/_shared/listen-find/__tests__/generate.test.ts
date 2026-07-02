/**
 * Shared listen-find generator — pure domain tests.
 * No UI, no React, no timers, no Math.random.
 */

import {
  mulberry32,
  shuffled,
  pick,
  assembleChoices,
  orderFor,
  buildRound,
} from '../generate';
import type { FindItem } from '../types';

const POOL: readonly FindItem[] = [
  { id: 'A', glyph: 'A' },
  { id: 'B', glyph: 'B' },
  { id: 'C', glyph: 'C' },
  { id: 'D', glyph: 'D' },
  { id: 'E', glyph: 'E' },
];

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = Array.from({ length: 10 }, mulberry32(42));
    const b = Array.from({ length: 10 }, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffled / pick', () => {
  it('shuffled is a permutation and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffled(input, mulberry32(7));
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('pick returns an element of the array', () => {
    expect(POOL).toContain(pick(POOL, mulberry32(3)));
  });
});

describe('assembleChoices', () => {
  it('contains exactly one target and N distinct items', () => {
    const { choices, correctIndex } = assembleChoices(POOL[0], POOL, 7, 3);
    expect(choices).toHaveLength(3);
    expect(choices[correctIndex].id).toBe('A');
    const ids = choices.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids.filter((id) => id === 'A')).toHaveLength(1);
  });

  it('is deterministic for the same seed', () => {
    expect(assembleChoices(POOL[0], POOL, 7, 3)).toEqual(
      assembleChoices(POOL[0], POOL, 7, 3),
    );
  });

  it('shrinks the row when the pool is too small for enough distractors', () => {
    const tiny: readonly FindItem[] = [POOL[0], POOL[1]];
    const { choices, correctIndex } = assembleChoices(tiny[0], tiny, 1, 3);
    expect(choices).toHaveLength(2);
    expect(choices[correctIndex].id).toBe('A');
  });
});

describe('orderFor', () => {
  it('is a permutation covering every index once', () => {
    const order = orderFor(5, 99);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it('is deterministic per seed and differs across seeds', () => {
    expect(orderFor(5, 99)).toEqual(orderFor(5, 99));
    expect(orderFor(26, 1)).not.toEqual(orderFor(26, 2));
  });
});

describe('buildRound', () => {
  it('walks the shuffled order so a length-N ladder covers each item once', () => {
    const order = orderFor(POOL.length, 3);
    const seen = new Set<string>();
    for (let level = 1; level <= POOL.length; level++) {
      seen.add(buildRound(POOL, order, level, level * 7919, 3).target.id);
    }
    expect(seen.size).toBe(POOL.length);
  });

  it('round always contains its target', () => {
    const order = orderFor(POOL.length, 5);
    const r = buildRound(POOL, order, 2, 2 * 7919, 3);
    expect(r.choices[r.correctIndex].id).toBe(r.target.id);
  });

  it('tolerates non-positive levels via positive modulo', () => {
    const order = orderFor(POOL.length, 5);
    expect(() => buildRound(POOL, order, 0, 1, 3)).not.toThrow();
    expect(() => buildRound(POOL, order, -3, 1, 3)).not.toThrow();
  });
});
