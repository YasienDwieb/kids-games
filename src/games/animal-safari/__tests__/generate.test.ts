/**
 * Animal Safari — generate.ts unit tests.
 * Pure domain; no UI, no React, no timers, no Math.random.
 */

import {
  mulberry32,
  shuffled,
  pick,
  assembleChoices,
  buildRound,
  SOUND_ANIMALS,
} from '../utils/generate';
import { ANIMALS, CHOICES_PER_ROUND, modeForLevel } from '../constants';
import type { Animal } from '../types';

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
    const a = shuffled(ANIMALS, mulberry32(7));
    const b = shuffled(ANIMALS, mulberry32(7));
    expect(a).toEqual(b);
  });

  it('does not mutate its input', () => {
    const before = [...ANIMALS];
    shuffled(ANIMALS, mulberry32(123));
    expect([...ANIMALS]).toEqual(before);
  });

  it('is a permutation (same multiset of ids)', () => {
    const out = shuffled(ANIMALS, mulberry32(55));
    expect(out).toHaveLength(ANIMALS.length);
    expect(out.map((a) => a.id).sort()).toEqual(ANIMALS.map((a) => a.id).sort());
  });
});

describe('pick', () => {
  it('returns a member of the array', () => {
    const r = mulberry32(9);
    for (let i = 0; i < 50; i++) {
      expect(ANIMALS).toContain(pick(ANIMALS, r));
    }
  });

  it('is deterministic for the same seed', () => {
    expect(pick(SOUND_ANIMALS, mulberry32(3))).toBe(pick(SOUND_ANIMALS, mulberry32(3)));
  });
});

// ---------------------------------------------------------------------------
// SOUND_ANIMALS — the sound-bearing subset
// ---------------------------------------------------------------------------

describe('SOUND_ANIMALS', () => {
  it('contains exactly the animals with hasSound', () => {
    expect(SOUND_ANIMALS).toHaveLength(11);
    SOUND_ANIMALS.forEach((a) => expect(a.hasSound).toBe(true));
  });

  it('never includes cow', () => {
    expect(SOUND_ANIMALS.some((a) => a.id === 'cow')).toBe(false);
  });

  it('is a subset of ANIMALS', () => {
    SOUND_ANIMALS.forEach((a) => {
      expect(ANIMALS.some((x) => x.id === a.id)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// assembleChoices — invariants across both pools & many seeds
// ---------------------------------------------------------------------------

/** Assert all structural invariants for one assembleChoices result. */
function assertChoicesValid(
  target: Animal,
  pool: readonly Animal[],
  result: { choices: readonly Animal[]; correctIndex: number },
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
  expect(choices.filter((a) => a.id === target.id)).toHaveLength(1);

  // All choices distinct by id.
  const ids = choices.map((a) => a.id);
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
    { name: 'all-animals', pool: ANIMALS },
    { name: 'sound-animals', pool: SOUND_ANIMALS },
  ]) {
    describe(`${inv.name} pool`, () => {
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
    const target = ANIMALS[4];
    const r1 = assembleChoices(target, ANIMALS, 1234);
    const r2 = assembleChoices(target, ANIMALS, 1234);
    expect(r1).toEqual(r2);
  });

  it('different seeds produce different layouts (probabilistically)', () => {
    const target = ANIMALS[0];
    const layouts = [1, 2, 3, 4, 5, 6, 7, 8].map((s) =>
      assembleChoices(target, ANIMALS, s * 1000).choices.map((a) => a.id).join(','),
    );
    expect(new Set(layouts).size).toBeGreaterThan(1);
  });

  it('does not mutate the inventory', () => {
    const before = [...ANIMALS];
    assembleChoices(ANIMALS[3], ANIMALS, 42);
    expect([...ANIMALS]).toEqual(before);
  });

  it('shrinks the row (still exactly one target) when the pool is too small', () => {
    const tiny: readonly Animal[] = [ANIMALS[0], ANIMALS[1]]; // 2 < CHOICES_PER_ROUND
    const result = assembleChoices(tiny[0], tiny, 7);
    expect(result.choices).toHaveLength(2);
    expect(result.choices.filter((a) => a.id === tiny[0].id)).toHaveLength(1);
  });

  it('single-animal pool yields a 1-choice row containing only the target', () => {
    const solo: readonly Animal[] = [ANIMALS[5]];
    const result = assembleChoices(solo[0], solo, 99);
    expect(result.choices).toHaveLength(1);
    expect(result.correctIndex).toBe(0);
    expect(result.choices[0].id).toBe(solo[0].id);
  });
});

// ---------------------------------------------------------------------------
// assembleChoices — multi-seed sweep (>= 500 per pool)
// ---------------------------------------------------------------------------

describe('assembleChoices sweep (>= 500 seeds per pool)', () => {
  const SWEEP = 600;

  for (const inv of [
    { name: 'all-animals', pool: ANIMALS },
    { name: 'sound-animals', pool: SOUND_ANIMALS },
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
// buildRound — mode alternation + per-mode pool constraints
// ---------------------------------------------------------------------------

describe('buildRound', () => {
  const SWEEP = 60; // > both pool lengths so the order-walk wraps

  it('mode alternates by parity and matches modeForLevel', () => {
    for (let lvl = 1; lvl <= SWEEP; lvl++) {
      const round = buildRound(lvl, lvl * 7919);
      expect(round.mode).toBe(modeForLevel(lvl));
      expect(round.mode).toBe(lvl % 2 === 1 ? 'hearName' : 'whichSound');
    }
  });

  it('hearName target walks ALL animals in order (wrapping by length)', () => {
    for (let lvl = 1; lvl <= SWEEP; lvl += 2) {
      const round = buildRound(lvl, lvl * 7919);
      expect(round.mode).toBe('hearName');
      const expected = ANIMALS[(lvl - 1) % ANIMALS.length];
      expect(round.target.id).toBe(expected.id);
    }
  });

  it('whichSound target walks SOUND_ANIMALS in order (wrapping by length)', () => {
    for (let lvl = 2; lvl <= SWEEP; lvl += 2) {
      const round = buildRound(lvl, lvl * 7919);
      expect(round.mode).toBe('whichSound');
      const expected = SOUND_ANIMALS[(lvl - 1) % SOUND_ANIMALS.length];
      expect(round.target.id).toBe(expected.id);
    }
  });

  it('whichSound target ALWAYS has a sound (never cow)', () => {
    for (let lvl = 2; lvl <= SWEEP; lvl += 2) {
      const round = buildRound(lvl, lvl * 7919);
      expect(round.target.hasSound).toBe(true);
      expect(round.target.id).not.toBe('cow');
    }
  });

  it('whichSound choices ALWAYS all have a sound (never cow)', () => {
    for (let lvl = 2; lvl <= SWEEP; lvl += 2) {
      const round = buildRound(lvl, lvl * 7919);
      round.choices.forEach((c) => {
        expect(c.hasSound).toBe(true);
        expect(c.id).not.toBe('cow');
      });
    }
  });

  it('every round carries valid choices + correctIndex (correct pool per mode)', () => {
    for (let lvl = 1; lvl <= SWEEP; lvl++) {
      const round = buildRound(lvl, lvl * 7919);
      const pool = round.mode === 'whichSound' ? SOUND_ANIMALS : ANIMALS;
      assertChoicesValid(round.target, pool, {
        choices: round.choices,
        correctIndex: round.correctIndex,
      });
    }
  });

  it('is deterministic — same args → identical round', () => {
    const r1 = buildRound(3, 3 * 7919);
    const r2 = buildRound(3, 3 * 7919);
    expect(r1).toEqual(r2);
  });

  it('different seeds produce different layouts for the same level (probabilistically)', () => {
    const layouts = [1, 2, 3, 4, 5, 6, 7, 8].map((s) =>
      buildRound(1, s * 1000).choices.map((a) => a.id).join(','),
    );
    expect(new Set(layouts).size).toBeGreaterThan(1);
  });
});
