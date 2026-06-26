/**
 * Letter Land — generate.ts unit tests.
 * Pure domain; no UI, no React, no timers, no Math.random.
 */

import { mulberry32, shuffled, pick, assembleChoices, buildRound } from '../utils/generate';
import {
  CHOICES_PER_ROUND,
  LATIN_LETTERS,
  ARABIC_LETTERS,
  modeForLevel,
} from '../constants';
import type { Letter } from '../types';

// ---------------------------------------------------------------------------
// mulberry32
// ---------------------------------------------------------------------------

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const v1 = Array.from({ length: 20 }, () => r1());
    const v2 = Array.from({ length: 20 }, () => r2());
    expect(v1).toEqual(v2);
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different first values for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
    expect(mulberry32(100)()).not.toBe(mulberry32(200)());
  });

  it('state is isolated between instances', () => {
    const r1 = mulberry32(5);
    const r2 = mulberry32(5);
    r1(); // advance r1
    expect(r2()).toBe(mulberry32(5)());
  });
});

// ---------------------------------------------------------------------------
// shuffled / pick — array helpers
// ---------------------------------------------------------------------------

describe('shuffled', () => {
  it('is deterministic for the same seed', () => {
    const a = shuffled(LATIN_LETTERS, mulberry32(7));
    const b = shuffled(LATIN_LETTERS, mulberry32(7));
    expect(a).toEqual(b);
  });

  it('does not mutate its input', () => {
    const before = [...LATIN_LETTERS];
    shuffled(LATIN_LETTERS, mulberry32(123));
    expect([...LATIN_LETTERS]).toEqual(before);
  });

  it('is a permutation (same multiset of ids)', () => {
    const out = shuffled(LATIN_LETTERS, mulberry32(55));
    expect(out).toHaveLength(LATIN_LETTERS.length);
    expect(out.map((l) => l.id).sort()).toEqual(LATIN_LETTERS.map((l) => l.id).sort());
  });
});

describe('pick', () => {
  it('returns a member of the array', () => {
    const r = mulberry32(9);
    for (let i = 0; i < 50; i++) {
      expect(LATIN_LETTERS).toContain(pick(LATIN_LETTERS, r));
    }
  });

  it('is deterministic for the same seed', () => {
    expect(pick(ARABIC_LETTERS, mulberry32(3))).toBe(pick(ARABIC_LETTERS, mulberry32(3)));
  });
});

// ---------------------------------------------------------------------------
// assembleChoices — invariants across both inventories & many seeds
// ---------------------------------------------------------------------------

/** Assert all structural invariants for one assembleChoices result. */
function assertChoicesValid(
  target: Letter,
  pool: readonly Letter[],
  result: { choices: readonly Letter[]; correctIndex: number },
): void {
  const { choices, correctIndex } = result;

  // Length is CHOICES_PER_ROUND when the pool is large enough.
  const expectedLen = Math.min(CHOICES_PER_ROUND, pool.length);
  expect(choices).toHaveLength(expectedLen);

  // correctIndex in bounds and points at the target.
  expect(correctIndex).toBeGreaterThanOrEqual(0);
  expect(correctIndex).toBeLessThan(choices.length);
  expect(choices[correctIndex].id).toBe(target.id);

  // Exactly one correct entry.
  expect(choices.filter((l) => l.id === target.id)).toHaveLength(1);

  // All choices distinct by id.
  const ids = choices.map((l) => l.id);
  expect(new Set(ids).size).toBe(ids.length);

  // Distractors (everything but the correct slot): exclude target, are in pool.
  const distractors = choices.filter((_, i) => i !== correctIndex);
  distractors.forEach((d) => {
    expect(d.id).not.toBe(target.id);
    expect(pool.some((p) => p.id === d.id)).toBe(true);
  });
}

describe('assembleChoices', () => {
  const SEEDS = [0, 1, 7919, 12345, 99991, 314159, 271828];

  for (const inv of [
    { name: 'latin', pool: LATIN_LETTERS },
    { name: 'arabic', pool: ARABIC_LETTERS },
  ]) {
    describe(`${inv.name} inventory`, () => {
      for (const seed of SEEDS) {
        it(`seed=${seed}: every target yields valid choices`, () => {
          for (const target of inv.pool) {
            const result = assembleChoices(target, inv.pool, seed);
            assertChoicesValid(target, inv.pool, result);
          }
        });
      }
    });
  }

  it('is deterministic — same target+pool+seed → identical result', () => {
    const target = LATIN_LETTERS[4];
    const r1 = assembleChoices(target, LATIN_LETTERS, 1234);
    const r2 = assembleChoices(target, LATIN_LETTERS, 1234);
    expect(r1).toEqual(r2);
  });

  it('different seeds produce different layouts (probabilistically)', () => {
    const target = LATIN_LETTERS[0];
    const layouts = [1, 2, 3, 4, 5, 6, 7, 8].map((s) =>
      assembleChoices(target, LATIN_LETTERS, s * 1000).choices.map((l) => l.id).join(','),
    );
    expect(new Set(layouts).size).toBeGreaterThan(1);
  });

  it('does not mutate the inventory', () => {
    const before = [...LATIN_LETTERS];
    assembleChoices(LATIN_LETTERS[3], LATIN_LETTERS, 42);
    expect([...LATIN_LETTERS]).toEqual(before);
  });

  it('shrinks the row (still exactly one target) when the pool is too small', () => {
    const tiny: readonly Letter[] = [LATIN_LETTERS[0], LATIN_LETTERS[1]]; // 2 < CHOICES_PER_ROUND
    const result = assembleChoices(tiny[0], tiny, 7);
    expect(result.choices).toHaveLength(2);
    expect(result.choices.filter((l) => l.id === tiny[0].id)).toHaveLength(1);
  });

  it('single-letter pool yields a 1-choice row containing only the target', () => {
    const solo: readonly Letter[] = [LATIN_LETTERS[5]];
    const result = assembleChoices(solo[0], solo, 99);
    expect(result.choices).toHaveLength(1);
    expect(result.correctIndex).toBe(0);
    expect(result.choices[0].id).toBe(solo[0].id);
  });
});

// ---------------------------------------------------------------------------
// assembleChoices — multi-seed sweep (>= 500 per inventory)
// ---------------------------------------------------------------------------

describe('assembleChoices sweep (>= 500 seeds per inventory)', () => {
  const SWEEP = 600;

  for (const inv of [
    { name: 'latin', pool: LATIN_LETTERS },
    { name: 'arabic', pool: ARABIC_LETTERS },
  ]) {
    it(`${inv.name}: invariants hold across ${SWEEP} seeds`, () => {
      for (let i = 1; i <= SWEEP; i++) {
        const seed = i * 7919;
        const target = inv.pool[i % inv.pool.length];
        assertChoicesValid(target, inv.pool, assembleChoices(target, inv.pool, seed));
      }
    });
  }
});

// ---------------------------------------------------------------------------
// buildRound — every round is hearAndFind
// ---------------------------------------------------------------------------

describe('buildRound', () => {
  const SWEEP = 60; // > both inventory lengths so the order-walk wraps

  for (const inv of [
    { name: 'latin', pool: LATIN_LETTERS },
    { name: 'arabic', pool: ARABIC_LETTERS },
  ]) {
    describe(`${inv.name} inventory`, () => {
      it('mode is always hearAndFind (and matches modeForLevel)', () => {
        for (let lvl = 1; lvl <= SWEEP; lvl++) {
          const round = buildRound(inv.pool, lvl, lvl * 7919);
          expect(round.mode).toBe('hearAndFind');
          expect(round.mode).toBe(modeForLevel(lvl));
        }
      });

      it('target walks the set in order (wrapping by length)', () => {
        for (let lvl = 1; lvl <= SWEEP; lvl++) {
          const round = buildRound(inv.pool, lvl, lvl * 7919);
          const expected = inv.pool[(lvl - 1) % inv.pool.length];
          expect(round.target.id).toBe(expected.id);
        }
      });

      it('every round carries valid choices + correctIndex', () => {
        for (let lvl = 1; lvl <= SWEEP; lvl++) {
          const round = buildRound(inv.pool, lvl, lvl * 7919);
          assertChoicesValid(round.target, inv.pool, {
            choices: round.choices,
            correctIndex: round.correctIndex,
          });
        }
      });
    });
  }

  it('is deterministic — same args → identical round', () => {
    const r1 = buildRound(LATIN_LETTERS, 3, 3 * 7919);
    const r2 = buildRound(LATIN_LETTERS, 3, 3 * 7919);
    expect(r1).toEqual(r2);
  });

  it('every level is hearAndFind regardless of parity', () => {
    expect(buildRound(LATIN_LETTERS, 1, 7919).mode).toBe('hearAndFind');
    expect(buildRound(LATIN_LETTERS, 2, 15838).mode).toBe('hearAndFind');
    expect(buildRound(ARABIC_LETTERS, 5, 39595).mode).toBe('hearAndFind');
    expect(buildRound(ARABIC_LETTERS, 6, 47514).mode).toBe('hearAndFind');
  });
});
