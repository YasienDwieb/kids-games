/**
 * Letter Land — levels.ts unit tests.
 *
 * Pure domain; deterministic (seed = level × 7919). No UI, no React, no timers,
 * no Math.random.
 *
 * Coverage:
 *   1. count === inventory length for both ladders (finite source)
 *   2. get(1) & get(count) valid & solvable for both
 *   3. Structural validity sweep over the whole finite range
 *   4. Every round is hearAndFind (matches modeForLevel); target walks the set in order
 *   5. Determinism: repeated get(n) is identical (stateless source)
 *   6. get(out-of-range) contract — levelsFromGenerator(count) does NOT
 *      range-check get() (the host clamps via count/isLast); it returns a
 *      valid round with the target wrapped by length.
 *   7. makeLetterLandLevels factory parity with get()
 */

import { LATIN_LEVELS, ARABIC_LEVELS, makeLetterLandLevels } from '../utils/levels';
import { LATIN_LETTERS, ARABIC_LETTERS, CHOICES_PER_ROUND, modeForLevel } from '../constants';
import { buildRound } from '../utils/generate';
import type { Letter, LevelData } from '../types';

// ---------------------------------------------------------------------------
// Helper: assert one LevelData is structurally valid & solvable
// ---------------------------------------------------------------------------

function assertLevelValid(data: LevelData, pool: readonly Letter[]): void {
  expect(data.level).toBeGreaterThanOrEqual(1);
  expect(data.round).toBeDefined();

  // Every round is hearAndFind (and still matches modeForLevel).
  expect(data.round.mode).toBe('hearAndFind');
  expect(data.round.mode).toBe(modeForLevel(data.level));

  // Target is the in-order (wrapping) letter for this level, and is from pool.
  const expectedTarget = pool[(data.level - 1) % pool.length];
  expect(data.round.target.id).toBe(expectedTarget.id);
  expect(pool.some((p) => p.id === data.round.target.id)).toBe(true);

  const { choices, correctIndex, target } = data.round;

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

// ---------------------------------------------------------------------------
// Per-inventory ladders — parameterized
// ---------------------------------------------------------------------------

const LADDERS = [
  { name: 'LATIN_LEVELS', source: LATIN_LEVELS, pool: LATIN_LETTERS },
  { name: 'ARABIC_LEVELS', source: ARABIC_LEVELS, pool: ARABIC_LETTERS },
] as const;

describe.each(LADDERS)('$name (finite ladder)', ({ source, pool }) => {
  it('count equals the inventory length', () => {
    expect(source.count).toBe(pool.length);
  });

  it('count is finite (defined)', () => {
    expect(source.count).toBeDefined();
    expect(typeof source.count).toBe('number');
  });

  it('get(1) is valid & solvable', () => {
    const data = source.get(1);
    expect(data.level).toBe(1);
    assertLevelValid(data, pool);
  });

  it('get(count) — the last level — is valid & solvable', () => {
    const last = source.count as number;
    const data = source.get(last);
    expect(data.level).toBe(last);
    assertLevelValid(data, pool);
  });

  it('every level 1..count is valid & solvable', () => {
    const count = source.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      assertLevelValid(source.get(lvl), pool);
    }
  });

  it('covers every letter exactly once across the finite ladder', () => {
    const count = source.count as number;
    const targetIds = Array.from({ length: count }, (_, i) => source.get(i + 1).round.target.id);
    expect(new Set(targetIds).size).toBe(pool.length);
    expect(targetIds.slice().sort()).toEqual(pool.map((l) => l.id).slice().sort());
  });

  it('every level is hearAndFind', () => {
    const count = source.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(source.get(lvl).round.mode).toBe('hearAndFind');
      expect(source.get(lvl).round.mode).toBe(modeForLevel(lvl));
    }
  });

  it('is stateless — repeated get(n) returns an identical level', () => {
    const count = source.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(source.get(lvl)).toEqual(source.get(lvl));
    }
  });

  it('matches buildRound(pool, level, level*7919) for every level', () => {
    const count = source.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(source.get(lvl)).toEqual({ level: lvl, round: buildRound(pool, lvl, lvl * 7919) });
    }
  });
});

// ---------------------------------------------------------------------------
// Out-of-range get() — source contract
// ---------------------------------------------------------------------------
//
// levelsFromGenerator({ count }) deliberately does NOT range-check get()
// (the host guards the upper bound via `count` / `isLast`, and never requests a
// level below 1). Out-of-range access must therefore NOT throw. For host-
// reachable over-range levels (> count) the target wraps via the positive
// `(level - 1) % length`, mirroring buildRound exactly.

describe('get(out-of-range) does not throw (generator source contract)', () => {
  it.each(LADDERS)('$name: get(0), get(count+1), get(1000) never throw', ({ source }) => {
    const count = source.count as number;
    for (const lvl of [0, count + 1, count + 2, 1000]) {
      expect(() => source.get(lvl)).not.toThrow();
      // level field echoes the requested number (generator passes it straight through).
      expect(source.get(lvl).level).toBe(lvl);
    }
  });

  it.each(LADDERS)('$name: over-range levels (> count) wrap to a valid in-pool target', ({ source, pool }) => {
    const count = source.count as number;
    for (const lvl of [count + 1, count + 2, 1000]) {
      const data = source.get(lvl);
      // Mirrors buildRound's plain positive modulo (lvl >= 1 ⇒ index >= 0).
      const expectedTarget = pool[(lvl - 1) % pool.length];
      expect(data.round.target.id).toBe(expectedTarget.id);
      expect(pool.some((p) => p.id === data.round.target.id)).toBe(true);
    }
  });

  it('wraps to the same letter one full cycle later (LATIN)', () => {
    const count = LATIN_LEVELS.count as number;
    // level (count + 1) walks back to letter index 0 (same as level 1's target).
    expect(LATIN_LEVELS.get(count + 1).round.target.id).toBe(LATIN_LEVELS.get(1).round.target.id);
  });
});

// ---------------------------------------------------------------------------
// makeLetterLandLevels factory
// ---------------------------------------------------------------------------

describe('makeLetterLandLevels factory', () => {
  it('builds a finite source whose count is the given set length', () => {
    expect(makeLetterLandLevels(LATIN_LETTERS).count).toBe(LATIN_LETTERS.length);
    expect(makeLetterLandLevels(ARABIC_LETTERS).count).toBe(ARABIC_LETTERS.length);
  });

  it('get(level) matches buildRound for the given set', () => {
    const src = makeLetterLandLevels(LATIN_LETTERS);
    const count = src.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(src.get(lvl)).toEqual({ level: lvl, round: buildRound(LATIN_LETTERS, lvl, lvl * 7919) });
    }
  });

  it('is deterministic — two factories over the same set agree', () => {
    const a = makeLetterLandLevels(ARABIC_LETTERS);
    const b = makeLetterLandLevels(ARABIC_LETTERS);
    const count = a.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(a.get(lvl)).toEqual(b.get(lvl));
    }
  });

  it('respects a custom (smaller) inventory length', () => {
    const tiny: readonly Letter[] = [LATIN_LETTERS[0], LATIN_LETTERS[1], LATIN_LETTERS[2]];
    const src = makeLetterLandLevels(tiny);
    expect(src.count).toBe(3);
    for (let lvl = 1; lvl <= 3; lvl++) {
      assertLevelValid(src.get(lvl), tiny);
    }
  });
});
