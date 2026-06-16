/**
 * Count & Pop — generate.ts unit tests.
 * Pure domain; no UI, no React, no timers, no Math.random.
 */

import {
  mulberry32,
  buildCountThisMany,
  buildHowMany,
  buildMakeN,
  buildAddition,
} from '../utils/generate';
import { MAX_OBJECTS, MAX_SUM, MAX_ADDEND, OBJECT_EMOJI } from '../constants';

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
    // r2 should still produce the same first value as r1's first call
    expect(r2()).toBe(mulberry32(5)());
  });
});

// ---------------------------------------------------------------------------
// buildCountThisMany
// ---------------------------------------------------------------------------

describe('buildCountThisMany', () => {
  const SEEDS = [1, 7919, 12345, 99991, 314159, 271828];
  const TARGETS = [1, 2, 3, 5, 8, 10];

  for (const seed of SEEDS) {
    for (const target of TARGETS) {
      it(`seed=${seed} target=${target}: valid round`, () => {
        const round = buildCountThisMany(seed, target);
        expect(round.mode).toBe('countThisMany');
        expect(round.target).toBe(target);
        expect(round.target).toBeGreaterThanOrEqual(1);
        expect(round.target).toBeLessThanOrEqual(MAX_OBJECTS);
        expect(OBJECT_EMOJI).toContain(round.objectEmoji);
      });
    }
  }

  it('is deterministic — same seed+target → identical round', () => {
    const r1 = buildCountThisMany(1234, 5);
    const r2 = buildCountThisMany(1234, 5);
    expect(r1).toEqual(r2);
  });

  it('different seeds produce different emoji (probabilistically)', () => {
    // With 8 emoji and enough seeds, at least two should differ
    const emojis = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => buildCountThisMany(s * 1000, 3).objectEmoji);
    const unique = new Set(emojis);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('clamps target below 1 to 1', () => {
    expect(buildCountThisMany(1, 0).target).toBe(1);
    expect(buildCountThisMany(1, -5).target).toBe(1);
  });

  it('clamps target above MAX_OBJECTS to MAX_OBJECTS', () => {
    expect(buildCountThisMany(1, MAX_OBJECTS + 1).target).toBe(MAX_OBJECTS);
    expect(buildCountThisMany(1, 999).target).toBe(MAX_OBJECTS);
  });

  it('does not mutate the OBJECT_EMOJI array', () => {
    const before = [...OBJECT_EMOJI];
    buildCountThisMany(42, 5);
    expect([...OBJECT_EMOJI]).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// buildHowMany
// ---------------------------------------------------------------------------

describe('buildHowMany', () => {
  const SEEDS = [1, 7919, 12345, 55555, 99991, 271828];
  const COUNTS = [1, 2, 3, 5, 8, 10];
  const CHOICE_COUNTS = [3, 4];

  for (const seed of SEEDS) {
    for (const count of COUNTS) {
      for (const choiceCount of CHOICE_COUNTS) {
        it(`seed=${seed} count=${count} choices=${choiceCount}: invariants`, () => {
          const round = buildHowMany(seed, count, choiceCount);
          expect(round.mode).toBe('howMany');
          expect(round.count).toBe(count);
          expect(round.choices).toHaveLength(choiceCount);

          // correctIndex in bounds
          expect(round.correctIndex).toBeGreaterThanOrEqual(0);
          expect(round.correctIndex).toBeLessThan(choiceCount);

          // choices[correctIndex] === count
          expect(round.choices[round.correctIndex]).toBe(count);

          // All choices distinct
          const unique = new Set(round.choices);
          expect(unique.size).toBe(choiceCount);

          // No negative choices
          round.choices.forEach((c) => {
            expect(c).toBeGreaterThanOrEqual(1);
            expect(c).toBeLessThanOrEqual(MAX_OBJECTS);
          });

          // Emoji from pool
          expect(OBJECT_EMOJI).toContain(round.objectEmoji);
        });
      }
    }
  }

  it('is deterministic — same args → identical round', () => {
    const r1 = buildHowMany(9999, 7, 4);
    const r2 = buildHowMany(9999, 7, 4);
    expect(r1).toEqual(r2);
  });

  it('different seeds produce different results (probabilistically)', () => {
    const r1 = buildHowMany(1, 5, 4);
    const r2 = buildHowMany(2, 5, 4);
    expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2));
  });

  it('exactly one correct choice per round (no duplicate correct)', () => {
    const round = buildHowMany(42, 6, 4);
    const correctCount = round.choices.filter((c) => c === round.count).length;
    expect(correctCount).toBe(1);
  });

  it('does not mutate inputs', () => {
    const emoji = [...OBJECT_EMOJI];
    buildHowMany(100, 3, 3);
    expect([...OBJECT_EMOJI]).toEqual(emoji);
  });
});

// ---------------------------------------------------------------------------
// buildMakeN
// ---------------------------------------------------------------------------

describe('buildMakeN', () => {
  // Pairs of (have, target) where target > have >= 0
  const PARAMS: Array<{ have: number; target: number }> = [
    { have: 1, target: 5 },
    { have: 2, target: 7 },
    { have: 3, target: 10 },
    { have: 4, target: 8 },
    { have: 1, target: 2 },
    { have: 0, target: 3 },
    { have: 5, target: 10 },
  ];
  const SEEDS = [1, 7919, 12345, 99991];
  const CHOICE_COUNTS = [3, 4];

  for (const { have, target } of PARAMS) {
    for (const seed of SEEDS) {
      for (const choiceCount of CHOICE_COUNTS) {
        it(`seed=${seed} have=${have} target=${target} choices=${choiceCount}: invariants`, () => {
          const round = buildMakeN(seed, have, target, choiceCount);
          expect(round.mode).toBe('makeN');

          const expectedAnswer = round.target - round.have;

          // correct answer is target - have, >= 1
          expect(expectedAnswer).toBeGreaterThanOrEqual(1);

          // choices[correctIndex] === correct answer
          expect(round.choices[round.correctIndex]).toBe(expectedAnswer);

          // correctIndex in bounds
          expect(round.correctIndex).toBeGreaterThanOrEqual(0);
          expect(round.correctIndex).toBeLessThan(round.choices.length);

          // Choices length is capped by available range [0..target]; at minimum 1
          // When target is small (e.g. target=2 → range [0,2] → max 3 choices),
          // choiceCount may exceed the range — we get as many as the range allows.
          const maxPossible = round.target + 1; // values 0..target
          const expectedChoiceCount = Math.min(choiceCount, maxPossible);
          expect(round.choices).toHaveLength(expectedChoiceCount);

          // All choices distinct
          const unique = new Set(round.choices);
          expect(unique.size).toBe(round.choices.length);

          // No negative choices
          round.choices.forEach((c) => {
            expect(c).toBeGreaterThanOrEqual(0);
            expect(c).toBeLessThanOrEqual(round.target);
          });

          // Emoji from pool
          expect(OBJECT_EMOJI).toContain(round.objectEmoji);
        });
      }
    }
  }

  it('is deterministic', () => {
    const r1 = buildMakeN(5555, 3, 8, 4);
    const r2 = buildMakeN(5555, 3, 8, 4);
    expect(r1).toEqual(r2);
  });

  it('correct answer is exactly target - have', () => {
    for (const { have, target } of PARAMS) {
      const round = buildMakeN(42, have, target, 3);
      expect(round.choices[round.correctIndex]).toBe(round.target - round.have);
    }
  });

  it('exactly one copy of correct answer in choices', () => {
    const round = buildMakeN(1000, 2, 9, 4);
    const correct = round.target - round.have;
    const count = round.choices.filter((c) => c === correct).length;
    expect(count).toBe(1);
  });

  it('does not mutate inputs', () => {
    const emoji = [...OBJECT_EMOJI];
    buildMakeN(77, 2, 5, 3);
    expect([...OBJECT_EMOJI]).toEqual(emoji);
  });
});

// ---------------------------------------------------------------------------
// buildAddition
// ---------------------------------------------------------------------------

describe('buildAddition', () => {
  // Pairs (a, b) with a, b in [0, MAX_ADDEND]
  const ADDEND_PAIRS: Array<{ a: number; b: number }> = [
    { a: 1, b: 1 },
    { a: 2, b: 3 },
    { a: 3, b: 4 },
    { a: 4, b: 5 },
    { a: 5, b: 6 },
    { a: 6, b: 6 },
    { a: 1, b: 6 },
    { a: 0, b: 5 },
  ];
  const SEEDS = [1, 7919, 12345, 99991, 314159];
  const CHOICE_COUNTS = [3, 4];

  for (const { a, b } of ADDEND_PAIRS) {
    for (const seed of SEEDS) {
      for (const choiceCount of CHOICE_COUNTS) {
        it(`seed=${seed} a=${a} b=${b} choices=${choiceCount}: invariants`, () => {
          const round = buildAddition(seed, a, b, choiceCount);
          expect(round.mode).toBe('addition');

          const expectedSum = round.a + round.b;

          // choices[correctIndex] === a + b
          expect(round.choices[round.correctIndex]).toBe(expectedSum);

          // correctIndex in bounds
          expect(round.correctIndex).toBeGreaterThanOrEqual(0);
          expect(round.correctIndex).toBeLessThan(round.choices.length);
          expect(round.choices).toHaveLength(choiceCount);

          // All choices distinct
          const unique = new Set(round.choices);
          expect(unique.size).toBe(choiceCount);

          // No negative choices; all <= MAX_SUM
          round.choices.forEach((c) => {
            expect(c).toBeGreaterThanOrEqual(0);
            expect(c).toBeLessThanOrEqual(MAX_SUM);
          });

          // Emoji from pool
          expect(OBJECT_EMOJI).toContain(round.objectEmoji);
        });
      }
    }
  }

  it('is deterministic', () => {
    const r1 = buildAddition(7777, 3, 4, 4);
    const r2 = buildAddition(7777, 3, 4, 4);
    expect(r1).toEqual(r2);
  });

  it('correct answer is exactly a + b', () => {
    for (const { a, b } of ADDEND_PAIRS) {
      const round = buildAddition(42, a, b, 3);
      expect(round.choices[round.correctIndex]).toBe(round.a + round.b);
    }
  });

  it('exactly one copy of correct answer in choices', () => {
    const round = buildAddition(9876, 4, 5, 4);
    const correct = round.a + round.b;
    const count = round.choices.filter((c) => c === correct).length;
    expect(count).toBe(1);
  });

  it('does not mutate inputs', () => {
    const emoji = [...OBJECT_EMOJI];
    buildAddition(55, 2, 3, 3);
    expect([...OBJECT_EMOJI]).toEqual(emoji);
  });

  it('clamps addends to MAX_ADDEND', () => {
    const round = buildAddition(1, MAX_ADDEND + 5, MAX_ADDEND + 10, 3);
    expect(round.a).toBeLessThanOrEqual(MAX_ADDEND);
    expect(round.b).toBeLessThanOrEqual(MAX_ADDEND);
  });

  it('all choices non-negative', () => {
    // Edge: a=0, b=0 → correct=0; distractors must not go below 0
    const round = buildAddition(1, 0, 0, 3);
    round.choices.forEach((c) => expect(c).toBeGreaterThanOrEqual(0));
  });
});

// ---------------------------------------------------------------------------
// Cross-builder sweep: 1000 seeds per builder, confirming no negatives and
// exactly one correct
// ---------------------------------------------------------------------------

describe('cross-builder sweep (1000 seeds)', () => {
  const SEED_COUNT = 1000;

  it('buildHowMany — no negative choices, exactly one correct', () => {
    for (let i = 1; i <= SEED_COUNT; i++) {
      const count = 1 + (i % MAX_OBJECTS);
      const round = buildHowMany(i * 137, count, 3 + (i % 2));
      expect(round.choices.filter((c) => c < 1)).toHaveLength(0);
      expect(round.choices.filter((c) => c === round.count)).toHaveLength(1);
      expect(round.choices[round.correctIndex]).toBe(round.count);
    }
  });

  it('buildMakeN — no negative choices, correct = target - have', () => {
    for (let i = 1; i <= SEED_COUNT; i++) {
      const have = i % 5;
      const target = have + 1 + (i % 5);
      const round = buildMakeN(i * 137, have, target, 3 + (i % 2));
      const expected = round.target - round.have;
      expect(expected).toBeGreaterThanOrEqual(1);
      expect(round.choices.filter((c) => c < 0)).toHaveLength(0);
      expect(round.choices[round.correctIndex]).toBe(expected);
      expect(round.choices.filter((c) => c === expected)).toHaveLength(1);
    }
  });

  it('buildAddition — no negative choices, correct = a + b', () => {
    for (let i = 1; i <= SEED_COUNT; i++) {
      const a = i % (MAX_ADDEND + 1);
      const b = (i + 2) % (MAX_ADDEND + 1);
      const round = buildAddition(i * 137, a, b, 3 + (i % 2));
      expect(round.choices.filter((c) => c < 0)).toHaveLength(0);
      expect(round.choices[round.correctIndex]).toBe(round.a + round.b);
      expect(round.choices.filter((c) => c === round.a + round.b)).toHaveLength(1);
    }
  });
});
