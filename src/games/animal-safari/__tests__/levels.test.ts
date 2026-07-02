/**
 * Animal Safari — levels.ts unit tests.
 *
 * Pure domain; deterministic (seed = level × 7919). No UI, no React, no timers,
 * no Math.random.
 *
 * Coverage:
 *   1. count === 12 (finite source)
 *   2. get(1) & get(count) valid & solvable
 *   3. Structural validity sweep over the whole finite range
 *   4. Mode alternation (matches modeForLevel); per-mode pool constraints
 *   5. whichSound target + choices ALWAYS hasSound (never cow)
 *   6. Determinism: repeated get(n) is identical (stateless source)
 *   7. get(out-of-range) contract — levelsFromGenerator(count) does NOT
 *      range-check get(); it returns a valid round with the target wrapped by
 *      the per-mode pool length, without throwing.
 *   8. Parity with buildRound(level, level*7919) for every level.
 */

import { animalSafariLevels, LEVEL_COUNT } from '../utils/levels';
import { ANIMALS, CHOICES_PER_ROUND, modeForLevel } from '../constants';
import { buildRound, SOUND_ANIMALS } from '../utils/generate';
import type { Animal, LevelData } from '../types';

// ---------------------------------------------------------------------------
// Helper: assert one LevelData is structurally valid & solvable
// ---------------------------------------------------------------------------

function assertLevelValid(data: LevelData): void {
  expect(data.round).toBeDefined();

  // Mode matches modeForLevel and the right pool applies.
  expect(data.round.mode).toBe(modeForLevel(data.level));
  const pool: readonly Animal[] = data.round.mode === 'whichSound' ? SOUND_ANIMALS : ANIMALS;

  // Target is the in-order (wrapping) animal for this level, from the pool.
  const expectedTarget = pool[(((data.level - 1) % pool.length) + pool.length) % pool.length];
  expect(data.round.target.id).toBe(expectedTarget.id);
  expect(pool.some((p) => p.id === data.round.target.id)).toBe(true);

  const { choices, correctIndex, target } = data.round;

  // whichSound rounds must be entirely sound-bearing (cow excluded).
  if (data.round.mode === 'whichSound') {
    expect(target.hasSound).toBe(true);
    expect(target.id).not.toBe('cow');
    choices.forEach((c) => {
      expect(c.hasSound).toBe(true);
      expect(c.id).not.toBe('cow');
    });
  }

  // Solvable: correctIndex points at the target.
  expect(correctIndex).toBeGreaterThanOrEqual(0);
  expect(correctIndex).toBeLessThan(choices.length);
  expect(choices[correctIndex].id).toBe(target.id);

  // Length is CHOICES_PER_ROUND when the pool can supply it.
  expect(choices).toHaveLength(Math.min(CHOICES_PER_ROUND, pool.length));

  // Exactly one correct; all distinct; distractors in pool & not the target.
  expect(choices.filter((a) => a.id === target.id)).toHaveLength(1);
  const ids = choices.map((a) => a.id);
  expect(new Set(ids).size).toBe(ids.length);
  choices
    .filter((_, i) => i !== correctIndex)
    .forEach((d) => {
      expect(d.id).not.toBe(target.id);
      expect(pool.some((p) => p.id === d.id)).toBe(true);
    });
}

// ---------------------------------------------------------------------------
// animalSafariLevels — finite ladder
// ---------------------------------------------------------------------------

describe('animalSafariLevels (finite ladder)', () => {
  it('count equals 12', () => {
    expect(animalSafariLevels.count).toBe(12);
    expect(LEVEL_COUNT).toBe(12);
    expect(animalSafariLevels.count).toBe(LEVEL_COUNT);
  });

  it('count is finite (defined number)', () => {
    expect(animalSafariLevels.count).toBeDefined();
    expect(typeof animalSafariLevels.count).toBe('number');
  });

  it('get(1) is valid & solvable', () => {
    const data = animalSafariLevels.get(1);
    expect(data.level).toBe(1);
    assertLevelValid(data);
  });

  it('get(count) — the last level — is valid & solvable', () => {
    const last = animalSafariLevels.count as number;
    const data = animalSafariLevels.get(last);
    expect(data.level).toBe(last);
    assertLevelValid(data);
  });

  it('every level 1..count is valid & solvable', () => {
    const count = animalSafariLevels.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      assertLevelValid(animalSafariLevels.get(lvl));
    }
  });

  it('mode alternates hearName / whichSound across the ladder', () => {
    const count = animalSafariLevels.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      const expected = lvl % 2 === 1 ? 'hearName' : 'whichSound';
      expect(animalSafariLevels.get(lvl).round.mode).toBe(expected);
      expect(animalSafariLevels.get(lvl).round.mode).toBe(modeForLevel(lvl));
    }
  });

  it('every whichSound level in the ladder is fully sound-bearing (never cow)', () => {
    const count = animalSafariLevels.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      const round = animalSafariLevels.get(lvl).round;
      if (round.mode === 'whichSound') {
        expect(round.target.id).not.toBe('cow');
        round.choices.forEach((c) => {
          expect(c.hasSound).toBe(true);
          expect(c.id).not.toBe('cow');
        });
      }
    }
  });

  it('is stateless — repeated get(n) returns an identical level', () => {
    const count = animalSafariLevels.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(animalSafariLevels.get(lvl)).toEqual(animalSafariLevels.get(lvl));
    }
  });

  it('matches buildRound(level, level*7919) for every level', () => {
    const count = animalSafariLevels.count as number;
    for (let lvl = 1; lvl <= count; lvl++) {
      expect(animalSafariLevels.get(lvl)).toEqual({
        level: lvl,
        round: buildRound(lvl, lvl * 7919),
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Out-of-range get() — source contract
// ---------------------------------------------------------------------------
//
// levelsFromGenerator({ count }) deliberately does NOT range-check get() (the
// host guards the upper bound via `count` / `isLast`, and never requests a
// level below 1). Out-of-range access must therefore NOT throw, and the target
// wraps via the per-mode positive modulo, mirroring buildRound exactly.

describe('get(out-of-range) does not throw (generator source contract)', () => {
  it('get(0), get(count+1), get(1000) never throw', () => {
    const count = animalSafariLevels.count as number;
    for (const lvl of [0, count + 1, count + 2, 1000]) {
      expect(() => animalSafariLevels.get(lvl)).not.toThrow();
      // level field echoes the requested number (generator passes it through).
      expect(animalSafariLevels.get(lvl).level).toBe(lvl);
    }
  });

  it('over-range levels (> count) wrap to a valid in-pool target', () => {
    const count = animalSafariLevels.count as number;
    for (const lvl of [count + 1, count + 2, 1000]) {
      const data = animalSafariLevels.get(lvl);
      const pool = data.round.mode === 'whichSound' ? SOUND_ANIMALS : ANIMALS;
      const idx = (((lvl - 1) % pool.length) + pool.length) % pool.length;
      expect(data.round.target.id).toBe(pool[idx].id);
      expect(pool.some((p) => p.id === data.round.target.id)).toBe(true);
    }
  });

  it('equals buildRound for out-of-range levels too', () => {
    for (const lvl of [0, (animalSafariLevels.count as number) + 1, 1000]) {
      expect(animalSafariLevels.get(lvl)).toEqual({
        level: lvl,
        round: buildRound(lvl, lvl * 7919),
      });
    }
  });
});
