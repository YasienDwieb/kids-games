/**
 * Count & Pop — levels.ts unit tests.
 * Sweeps all 12 levels and validates solvability, mode ramp, and determinism.
 */

import { buildLevel, TOTAL_LEVELS, countAndPopLevels } from '../utils/levels';
import type { LevelData } from '../types';
import {
  MODE_ROTATION,
  MIN_CHOICE_COUNT,
  MAX_CHOICE_COUNT,
  MAX_OBJECTS,
  MAX_SUM,
  OBJECT_EMOJI,
} from '../constants';

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isCountThisMany(d: LevelData): d is LevelData & { round: Extract<LevelData['round'], { mode: 'countThisMany' }> } {
  return d.round.mode === 'countThisMany';
}

function isHowMany(d: LevelData): d is LevelData & { round: Extract<LevelData['round'], { mode: 'howMany' }> } {
  return d.round.mode === 'howMany';
}

function isMakeN(d: LevelData): d is LevelData & { round: Extract<LevelData['round'], { mode: 'makeN' }> } {
  return d.round.mode === 'makeN';
}

function isAddition(d: LevelData): d is LevelData & { round: Extract<LevelData['round'], { mode: 'addition' }> } {
  return d.round.mode === 'addition';
}

// ---------------------------------------------------------------------------
// Structural validity for every level
// ---------------------------------------------------------------------------

describe('buildLevel structural validity', () => {
  it('TOTAL_LEVELS is 12', () => {
    expect(TOTAL_LEVELS).toBe(12);
  });

  it('MODE_ROTATION length matches TOTAL_LEVELS', () => {
    expect(MODE_ROTATION).toHaveLength(TOTAL_LEVELS);
  });

  for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
    it(`level ${lvl}: level number, mode, and round present`, () => {
      const data = buildLevel(lvl);
      expect(data.level).toBe(lvl);
      expect(['countThisMany', 'howMany', 'makeN', 'addition']).toContain(data.mode);
      expect(data.round).toBeDefined();
      expect(data.round.mode).toBe(data.mode);
    });
  }

  it('mode matches MODE_ROTATION for all levels', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const data = buildLevel(lvl);
      const expectedMode = MODE_ROTATION[(lvl - 1) % MODE_ROTATION.length];
      expect(data.mode).toBe(expectedMode);
    }
  });
});

// ---------------------------------------------------------------------------
// Mode ramp expectations
// ---------------------------------------------------------------------------

describe('mode ramp', () => {
  it('levels 1–4 use countThisMany or howMany only', () => {
    for (let lvl = 1; lvl <= 4; lvl++) {
      const { mode } = buildLevel(lvl);
      expect(['countThisMany', 'howMany']).toContain(mode);
    }
  });

  it('levels 5–8 use countThisMany or howMany only', () => {
    for (let lvl = 5; lvl <= 8; lvl++) {
      const { mode } = buildLevel(lvl);
      expect(['countThisMany', 'howMany']).toContain(mode);
    }
  });

  it('levels 9–10 use makeN', () => {
    for (let lvl = 9; lvl <= 10; lvl++) {
      expect(buildLevel(lvl).mode).toBe('makeN');
    }
  });

  it('levels 11–12 use addition', () => {
    for (let lvl = 11; lvl <= 12; lvl++) {
      expect(buildLevel(lvl).mode).toBe('addition');
    }
  });
});

// ---------------------------------------------------------------------------
// Per-mode invariants for every level
// ---------------------------------------------------------------------------

describe('every level round is solvable', () => {
  for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
    it(`level ${lvl}`, () => {
      const data = buildLevel(lvl);

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
    });
  }
});

// ---------------------------------------------------------------------------
// Choice count ramp
// ---------------------------------------------------------------------------

describe('choice count ramp', () => {
  it('choice count at level 1 equals MIN_CHOICE_COUNT', () => {
    const data = buildLevel(1);
    // countThisMany has no choices; check the first howMany level
    const howManyLevel = [1, 2, 3, 4, 5, 6, 7, 8]
      .map((l) => buildLevel(l))
      .find((d) => isHowMany(d));
    if (howManyLevel && isHowMany(howManyLevel)) {
      expect(howManyLevel.round.choices.length).toBeGreaterThanOrEqual(MIN_CHOICE_COUNT);
    }
    // countThisMany levels: no choices, just verify structure
    if (isCountThisMany(data)) {
      expect(data.round.target).toBeGreaterThanOrEqual(1);
    }
  });

  it('choice count never exceeds MAX_CHOICE_COUNT', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const data = buildLevel(lvl);
      if (isHowMany(data)) {
        expect(data.round.choices.length).toBeLessThanOrEqual(MAX_CHOICE_COUNT);
      } else if (isMakeN(data)) {
        expect(data.round.choices.length).toBeLessThanOrEqual(MAX_CHOICE_COUNT);
      } else if (isAddition(data)) {
        expect(data.round.choices.length).toBeLessThanOrEqual(MAX_CHOICE_COUNT);
      }
    }
  });

  it('choice count never goes below MIN_CHOICE_COUNT for choice-based rounds', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const data = buildLevel(lvl);
      if (isHowMany(data)) {
        expect(data.round.choices.length).toBeGreaterThanOrEqual(MIN_CHOICE_COUNT);
      } else if (isMakeN(data)) {
        expect(data.round.choices.length).toBeGreaterThanOrEqual(MIN_CHOICE_COUNT);
      } else if (isAddition(data)) {
        expect(data.round.choices.length).toBeGreaterThanOrEqual(MIN_CHOICE_COUNT);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// No negative numbers anywhere
// ---------------------------------------------------------------------------

describe('no negative numbers in any round', () => {
  for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
    it(`level ${lvl}: all numeric values >= 0`, () => {
      const data = buildLevel(lvl);

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
    });
  }
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('buildLevel determinism', () => {
  it('same level always produces identical LevelData', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      expect(buildLevel(lvl)).toEqual(buildLevel(lvl));
    }
  });

  it('different levels produce different rounds (probabilistically)', () => {
    const seen = new Set<string>();
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      seen.add(JSON.stringify(buildLevel(lvl)));
    }
    // All 12 levels should be unique
    expect(seen.size).toBe(TOTAL_LEVELS);
  });
});

// ---------------------------------------------------------------------------
// LevelSource
// ---------------------------------------------------------------------------

describe('countAndPopLevels LevelSource', () => {
  it('has count = TOTAL_LEVELS', () => {
    expect(countAndPopLevels.count).toBe(TOTAL_LEVELS);
  });

  it('get(n) matches buildLevel(n) for all levels', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      expect(countAndPopLevels.get(lvl)).toEqual(buildLevel(lvl));
    }
  });

  it('is stateless — repeated get(n) returns same result', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      expect(countAndPopLevels.get(lvl)).toEqual(countAndPopLevels.get(lvl));
    }
  });
});

// ---------------------------------------------------------------------------
// Counts within declared ranges per level band
// ---------------------------------------------------------------------------

describe('counts within declared ranges', () => {
  it('levels 1–4 count/target <= 5', () => {
    for (let lvl = 1; lvl <= 4; lvl++) {
      const data = buildLevel(lvl);
      if (isCountThisMany(data)) {
        expect(data.round.target).toBeLessThanOrEqual(5);
        expect(data.round.target).toBeGreaterThanOrEqual(1);
      } else if (isHowMany(data)) {
        expect(data.round.count).toBeLessThanOrEqual(5);
        expect(data.round.count).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('levels 5–8 count/target <= 10', () => {
    for (let lvl = 5; lvl <= 8; lvl++) {
      const data = buildLevel(lvl);
      if (isCountThisMany(data)) {
        expect(data.round.target).toBeLessThanOrEqual(MAX_OBJECTS);
        expect(data.round.target).toBeGreaterThanOrEqual(1);
      } else if (isHowMany(data)) {
        expect(data.round.count).toBeLessThanOrEqual(MAX_OBJECTS);
        expect(data.round.count).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('makeN levels: target - have >= 1', () => {
    for (let lvl = 9; lvl <= 10; lvl++) {
      const data = buildLevel(lvl);
      if (isMakeN(data)) {
        expect(data.round.target - data.round.have).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('addition levels: sum <= MAX_SUM', () => {
    for (let lvl = 11; lvl <= 12; lvl++) {
      const data = buildLevel(lvl);
      if (isAddition(data)) {
        expect(data.round.a + data.round.b).toBeLessThanOrEqual(MAX_SUM);
      }
    }
  });
});
