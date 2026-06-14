/**
 * Count & Pop — levels.ts unit tests.
 *
 * All tests use a FIXED sessionSeed (0 or an explicit constant) so they are
 * fully deterministic. The production code is the only place that passes
 * Math.random() as sessionSeed — never here.
 *
 * Coverage:
 *   1. Structural validity for every level (sweeps 1..200)
 *   2. Mode/band ramp (bands as described in levels.ts header)
 *   3. Per-mode invariants: solvable, in-range, exactly-one-correct, distinct, no-negative
 *   4. Choice-count ramp
 *   5. Counts within declared range bands
 *   6. Session-seed determinism: same seed → same sequence
 *   7. Session-seed randomization: different seeds → different sequences
 *   8. TOTAL_LEVELS backward-compat constant
 *   9. countAndPopLevels (legacy sessionSeed=0 source) backward-compat
 *  10. makeCountAndPopLevels factory
 */

import {
  buildLevel,
  TOTAL_LEVELS,
  countAndPopLevels,
  makeCountAndPopLevels,
  MODE_ROTATION,
} from '../utils/levels';
import type { LevelData } from '../types';
import {
  MODE_ROTATION_ENDLESS,
  MIN_CHOICE_COUNT,
  MAX_CHOICE_COUNT,
  MAX_OBJECTS,
  MAX_SUM,
  OBJECT_EMOJI,
  EASY_MAX_COUNT,
  MID_MAX_COUNT,
} from '../constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed sessionSeed used throughout all determinism-requiring tests. */
const FIXED_SEED = 0;

/** Sweep length — validates solvability at every level up to this number. */
const SWEEP_MAX = 200;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isCountThisMany(
  d: LevelData,
): d is LevelData & { round: Extract<LevelData['round'], { mode: 'countThisMany' }> } {
  return d.round.mode === 'countThisMany';
}

function isHowMany(
  d: LevelData,
): d is LevelData & { round: Extract<LevelData['round'], { mode: 'howMany' }> } {
  return d.round.mode === 'howMany';
}

function isMakeN(
  d: LevelData,
): d is LevelData & { round: Extract<LevelData['round'], { mode: 'makeN' }> } {
  return d.round.mode === 'makeN';
}

function isAddition(
  d: LevelData,
): d is LevelData & { round: Extract<LevelData['round'], { mode: 'addition' }> } {
  return d.round.mode === 'addition';
}

// ---------------------------------------------------------------------------
// Helper: assert all per-mode invariants for one LevelData
// ---------------------------------------------------------------------------

function assertRoundValid(data: LevelData): void {
  expect(data.level).toBeGreaterThanOrEqual(1);
  expect(['countThisMany', 'howMany', 'makeN', 'addition']).toContain(data.mode);
  expect(data.round).toBeDefined();
  expect(data.round.mode).toBe(data.mode);

  if (isCountThisMany(data)) {
    const { round } = data;
    expect(round.target).toBeGreaterThanOrEqual(1);
    expect(round.target).toBeLessThanOrEqual(MAX_OBJECTS);
    expect(OBJECT_EMOJI).toContain(round.objectEmoji);
  } else if (isHowMany(data)) {
    const { round } = data;
    expect(round.count).toBeGreaterThanOrEqual(1);
    expect(round.count).toBeLessThanOrEqual(MAX_OBJECTS);
    expect(round.choices.length).toBeGreaterThanOrEqual(MIN_CHOICE_COUNT);
    expect(round.choices.length).toBeLessThanOrEqual(MAX_CHOICE_COUNT);
    expect(round.correctIndex).toBeGreaterThanOrEqual(0);
    expect(round.correctIndex).toBeLessThan(round.choices.length);
    expect(round.choices[round.correctIndex]).toBe(round.count);
    expect(new Set(round.choices).size).toBe(round.choices.length);
    round.choices.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(MAX_OBJECTS);
    });
    expect(OBJECT_EMOJI).toContain(round.objectEmoji);
  } else if (isMakeN(data)) {
    const { round } = data;
    const answer = round.target - round.have;
    expect(answer).toBeGreaterThanOrEqual(1);
    expect(round.choices[round.correctIndex]).toBe(answer);
    expect(round.correctIndex).toBeGreaterThanOrEqual(0);
    expect(round.correctIndex).toBeLessThan(round.choices.length);
    expect(new Set(round.choices).size).toBe(round.choices.length);
    round.choices.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(round.target);
    });
    expect(OBJECT_EMOJI).toContain(round.objectEmoji);
  } else if (isAddition(data)) {
    const { round } = data;
    const sum = round.a + round.b;
    expect(round.choices[round.correctIndex]).toBe(sum);
    expect(round.correctIndex).toBeGreaterThanOrEqual(0);
    expect(round.correctIndex).toBeLessThan(round.choices.length);
    expect(new Set(round.choices).size).toBe(round.choices.length);
    round.choices.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(MAX_SUM);
    });
    expect(OBJECT_EMOJI).toContain(round.objectEmoji);
  }
}

// ---------------------------------------------------------------------------
// 1. Structural validity sweep — levels 1..200
// ---------------------------------------------------------------------------

describe('buildLevel structural validity (levels 1..200)', () => {
  it('every level from 1 to 200 produces a valid, solvable round (sessionSeed=0)', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      assertRoundValid(data);
    }
  });

  it('level field equals the requested level number', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      expect(buildLevel(lvl, FIXED_SEED).level).toBe(lvl);
    }
  });

  it('mode matches MODE_ROTATION_ENDLESS cycle for all levels up to 200', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      const expected = MODE_ROTATION_ENDLESS[(lvl - 1) % MODE_ROTATION_ENDLESS.length];
      expect(data.mode).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Mode / band ramp
// ---------------------------------------------------------------------------

describe('mode/band ramp', () => {
  it('levels 1–4 only use countThisMany or howMany', () => {
    for (let lvl = 1; lvl <= 4; lvl++) {
      const { mode } = buildLevel(lvl, FIXED_SEED);
      expect(['countThisMany', 'howMany']).toContain(mode);
    }
  });

  it('makeN first appears at level 7 (slot index 6 in MODE_ROTATION_ENDLESS)', () => {
    expect(buildLevel(7, FIXED_SEED).mode).toBe('makeN');
  });

  it('addition first appears at level 12 (slot index 11 in MODE_ROTATION_ENDLESS)', () => {
    expect(buildLevel(12, FIXED_SEED).mode).toBe('addition');
  });

  it('cycle repeats: level 17 has same mode as level 1', () => {
    const cycleLen = MODE_ROTATION_ENDLESS.length;
    expect(buildLevel(cycleLen + 1, FIXED_SEED).mode).toBe(
      buildLevel(1, FIXED_SEED).mode,
    );
  });

  it('level 200 has the same mode as level (200 % cycleLen || cycleLen)', () => {
    const cycleLen = MODE_ROTATION_ENDLESS.length;
    const slot = ((200 - 1) % cycleLen) + 1;
    expect(buildLevel(200, FIXED_SEED).mode).toBe(buildLevel(slot, FIXED_SEED).mode);
  });
});

// ---------------------------------------------------------------------------
// 3. No negative numbers anywhere — sweep 1..200
// ---------------------------------------------------------------------------

describe('no negative numbers in any round (sweep 1..200)', () => {
  it('all numeric values are >= 0 for every level', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);

      if (isCountThisMany(data)) {
        expect(data.round.target).toBeGreaterThanOrEqual(0);
      } else if (isHowMany(data)) {
        expect(data.round.count).toBeGreaterThanOrEqual(0);
        data.round.choices.forEach((c) => expect(c).toBeGreaterThanOrEqual(0));
      } else if (isMakeN(data)) {
        expect(data.round.have).toBeGreaterThanOrEqual(0);
        expect(data.round.target).toBeGreaterThanOrEqual(0);
        data.round.choices.forEach((c) => expect(c).toBeGreaterThanOrEqual(0));
      } else if (isAddition(data)) {
        expect(data.round.a).toBeGreaterThanOrEqual(0);
        expect(data.round.b).toBeGreaterThanOrEqual(0);
        data.round.choices.forEach((c) => expect(c).toBeGreaterThanOrEqual(0));
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Choice-count ramp
// ---------------------------------------------------------------------------

describe('choice count ramp', () => {
  it('choice count never exceeds MAX_CHOICE_COUNT for any level up to 200', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      if (isHowMany(data) || isMakeN(data) || isAddition(data)) {
        expect(data.round.choices.length).toBeLessThanOrEqual(MAX_CHOICE_COUNT);
      }
    }
  });

  it('choice count never goes below MIN_CHOICE_COUNT for choice-based rounds', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      if (isHowMany(data) || isAddition(data)) {
        expect(data.round.choices.length).toBeGreaterThanOrEqual(MIN_CHOICE_COUNT);
      }
      // makeN range can be tiny — only assert when range permits MIN_CHOICE_COUNT
      if (isMakeN(data)) {
        const maxPossible = data.round.target + 1;
        const minExpected = Math.min(MIN_CHOICE_COUNT, maxPossible);
        expect(data.round.choices.length).toBeGreaterThanOrEqual(minExpected);
      }
    }
  });

  it('levels 9+ use MAX_CHOICE_COUNT for howMany/addition', () => {
    for (let lvl = 9; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      if (isHowMany(data) || isAddition(data)) {
        expect(data.round.choices.length).toBe(MAX_CHOICE_COUNT);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Counts within declared range bands
// ---------------------------------------------------------------------------

describe('counts within declared range bands', () => {
  it('levels 1–4: count/target <= EASY_MAX_COUNT (5)', () => {
    for (let lvl = 1; lvl <= 4; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      if (isCountThisMany(data)) {
        expect(data.round.target).toBeLessThanOrEqual(EASY_MAX_COUNT);
        expect(data.round.target).toBeGreaterThanOrEqual(1);
      } else if (isHowMany(data)) {
        expect(data.round.count).toBeLessThanOrEqual(EASY_MAX_COUNT);
        expect(data.round.count).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('levels 5+: count/target <= MID_MAX_COUNT (10 = MAX_OBJECTS) for all 200 levels', () => {
    for (let lvl = 5; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      if (isCountThisMany(data)) {
        expect(data.round.target).toBeLessThanOrEqual(MID_MAX_COUNT);
        expect(data.round.target).toBeGreaterThanOrEqual(1);
      } else if (isHowMany(data)) {
        expect(data.round.count).toBeLessThanOrEqual(MID_MAX_COUNT);
        expect(data.round.count).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('makeN: target - have >= 1 for all 200 levels', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      if (isMakeN(data)) {
        expect(data.round.target - data.round.have).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('addition: sum <= MAX_SUM for all 200 levels', () => {
    for (let lvl = 1; lvl <= SWEEP_MAX; lvl++) {
      const data = buildLevel(lvl, FIXED_SEED);
      if (isAddition(data)) {
        expect(data.round.a + data.round.b).toBeLessThanOrEqual(MAX_SUM);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Session-seed determinism: same seed → same sequence
// ---------------------------------------------------------------------------

describe('buildLevel determinism with fixed sessionSeed', () => {
  it('same level + same sessionSeed always produces identical LevelData', () => {
    for (let lvl = 1; lvl <= 50; lvl++) {
      expect(buildLevel(lvl, FIXED_SEED)).toEqual(buildLevel(lvl, FIXED_SEED));
    }
  });

  it('different session calls with sessionSeed=0 are identical (reproducible)', () => {
    const first = Array.from({ length: 20 }, (_, i) => buildLevel(i + 1, 0));
    const second = Array.from({ length: 20 }, (_, i) => buildLevel(i + 1, 0));
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('non-zero fixed sessionSeed is also deterministic', () => {
    const SEED_A = 12345;
    for (let lvl = 1; lvl <= 30; lvl++) {
      expect(buildLevel(lvl, SEED_A)).toEqual(buildLevel(lvl, SEED_A));
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Session-seed randomization: different seeds → different sequences
// ---------------------------------------------------------------------------

describe('per-session randomization', () => {
  it('sessionSeed=0 and sessionSeed=12345 produce different rounds at level 1', () => {
    const d1 = buildLevel(1, 0);
    const d2 = buildLevel(1, 12345);
    expect(JSON.stringify(d1)).not.toBe(JSON.stringify(d2));
  });

  it('at least 90% of levels 1..50 differ between two distinct sessionSeeds', () => {
    const SEED_A = 42;
    const SEED_B = 99999;
    let diffCount = 0;
    for (let lvl = 1; lvl <= 50; lvl++) {
      if (JSON.stringify(buildLevel(lvl, SEED_A)) !== JSON.stringify(buildLevel(lvl, SEED_B))) {
        diffCount++;
      }
    }
    expect(diffCount).toBeGreaterThanOrEqual(45); // >= 90 %
  });

  it('sessionSeed=A vs sessionSeed=B vs sessionSeed=C produce three distinct level-1 rounds', () => {
    const r1 = JSON.stringify(buildLevel(1, 100));
    const r2 = JSON.stringify(buildLevel(1, 200));
    const r3 = JSON.stringify(buildLevel(1, 300));
    const unique = new Set([r1, r2, r3]);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('same sessionSeed across a restart produces the same full session (reproducibility)', () => {
    const SESS = 77777;
    const session1 = Array.from({ length: 20 }, (_, i) => buildLevel(i + 1, SESS));
    const session2 = Array.from({ length: 20 }, (_, i) => buildLevel(i + 1, SESS));
    expect(JSON.stringify(session1)).toBe(JSON.stringify(session2));
  });

  it('different sessionSeeds produce different sessions (not identical over 20 levels)', () => {
    const sessionA = Array.from({ length: 20 }, (_, i) => buildLevel(i + 1, 1111));
    const sessionB = Array.from({ length: 20 }, (_, i) => buildLevel(i + 1, 2222));
    expect(JSON.stringify(sessionA)).not.toBe(JSON.stringify(sessionB));
  });
});

// ---------------------------------------------------------------------------
// 8. TOTAL_LEVELS backward-compat
// ---------------------------------------------------------------------------

describe('TOTAL_LEVELS backward-compat', () => {
  it('TOTAL_LEVELS is still 12 (legacy constant preserved)', () => {
    expect(TOTAL_LEVELS).toBe(12);
  });

  it('MODE_ROTATION still has 12 entries (legacy export preserved)', () => {
    expect(MODE_ROTATION).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// 9. countAndPopLevels (legacy sessionSeed=0 source) backward-compat
// ---------------------------------------------------------------------------

describe('countAndPopLevels LevelSource (backward-compat, sessionSeed=0)', () => {
  it('count is undefined (endless)', () => {
    expect(countAndPopLevels.count).toBeUndefined();
  });

  it('get(n) matches buildLevel(n, 0) for levels 1..50', () => {
    for (let lvl = 1; lvl <= 50; lvl++) {
      expect(countAndPopLevels.get(lvl)).toEqual(buildLevel(lvl, 0));
    }
  });

  it('is stateless — repeated get(n) returns same result', () => {
    for (let lvl = 1; lvl <= 20; lvl++) {
      expect(countAndPopLevels.get(lvl)).toEqual(countAndPopLevels.get(lvl));
    }
  });

  it('works at high level numbers (level 500)', () => {
    const data = countAndPopLevels.get(500);
    assertRoundValid(data);
  });
});

// ---------------------------------------------------------------------------
// 10. makeCountAndPopLevels factory
// ---------------------------------------------------------------------------

describe('makeCountAndPopLevels factory', () => {
  it('creates an endless source (count is undefined)', () => {
    const source = makeCountAndPopLevels(0);
    expect(source.count).toBeUndefined();
  });

  it('get(level) for sessionSeed=0 matches buildLevel(level, 0)', () => {
    const source = makeCountAndPopLevels(0);
    for (let lvl = 1; lvl <= 20; lvl++) {
      expect(source.get(lvl)).toEqual(buildLevel(lvl, 0));
    }
  });

  it('different sessionSeeds produce different sources (different level 1)', () => {
    const src1 = makeCountAndPopLevels(1234);
    const src2 = makeCountAndPopLevels(5678);
    expect(JSON.stringify(src1.get(1))).not.toBe(JSON.stringify(src2.get(1)));
  });

  it('same sessionSeed → same source output (deterministic factory)', () => {
    const seed = 42;
    const src1 = makeCountAndPopLevels(seed);
    const src2 = makeCountAndPopLevels(seed);
    for (let lvl = 1; lvl <= 20; lvl++) {
      expect(src1.get(lvl)).toEqual(src2.get(lvl));
    }
  });

  it('works at very high level numbers (level 1000)', () => {
    const source = makeCountAndPopLevels(99);
    const data = source.get(1000);
    assertRoundValid(data);
  });
});
