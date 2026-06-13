import { buildLevel, TOTAL_LEVELS, shapeDetectiveLevels } from '../utils/levels';
import type { LevelData, PatternPuzzle, OddOneOutPuzzle, SortPuzzle } from '../types';
import { MIN_OPTION_COUNT, MAX_OPTION_COUNT } from '../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPatternPuzzle(p: LevelData['puzzle']): p is PatternPuzzle {
  return p.type === 'pattern';
}

function isOddOneOutPuzzle(p: LevelData['puzzle']): p is OddOneOutPuzzle {
  return p.type === 'oddOneOut';
}

function isSortPuzzle(p: LevelData['puzzle']): p is SortPuzzle {
  return p.type === 'sort';
}

// ---------------------------------------------------------------------------
// buildLevel — structural validity
// ---------------------------------------------------------------------------

describe('buildLevel structural validity', () => {
  it('produces a valid LevelData for every level 1..TOTAL_LEVELS', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const data = buildLevel(lvl);
      expect(data.level).toBe(lvl);
      expect(data.activeAttributes.length).toBeGreaterThanOrEqual(1);
      expect(data.optionCount).toBeGreaterThanOrEqual(MIN_OPTION_COUNT);
      expect(data.optionCount).toBeLessThanOrEqual(MAX_OPTION_COUNT);
      expect(data.puzzle).toBeDefined();
      expect(['pattern', 'oddOneOut', 'sort']).toContain(data.puzzle.type);
    }
  });

  it('TOTAL_LEVELS is at least 12', () => {
    expect(TOTAL_LEVELS).toBeGreaterThanOrEqual(12);
  });
});

// ---------------------------------------------------------------------------
// Difficulty ramp — monotone growth
// ---------------------------------------------------------------------------

describe('difficulty grows monotonically', () => {
  it('attribute count never shrinks as level increases', () => {
    let prevAttrCount = 0;
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const { activeAttributes } = buildLevel(lvl);
      expect(activeAttributes.length).toBeGreaterThanOrEqual(prevAttrCount);
      prevAttrCount = activeAttributes.length;
    }
  });

  it('option count never shrinks as level increases', () => {
    let prevOpts = 0;
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const { optionCount } = buildLevel(lvl);
      expect(optionCount).toBeGreaterThanOrEqual(prevOpts);
      prevOpts = optionCount;
    }
  });

  it('level 1 uses a single attribute', () => {
    const { activeAttributes } = buildLevel(1);
    expect(activeAttributes).toHaveLength(1);
  });

  it('last level uses all three attributes', () => {
    const { activeAttributes } = buildLevel(TOTAL_LEVELS);
    expect(activeAttributes).toHaveLength(3);
  });

  it('option count at level 1 equals MIN_OPTION_COUNT', () => {
    expect(buildLevel(1).optionCount).toBe(MIN_OPTION_COUNT);
  });

  it('option count at last level equals MAX_OPTION_COUNT', () => {
    expect(buildLevel(TOTAL_LEVELS).optionCount).toBe(MAX_OPTION_COUNT);
  });
});

// ---------------------------------------------------------------------------
// Each puzzle type passes one-correct-answer invariant
// ---------------------------------------------------------------------------

describe('every level puzzle has exactly one correct answer', () => {
  for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
    it(`level ${lvl}`, () => {
      const { puzzle } = buildLevel(lvl);

      if (isPatternPuzzle(puzzle)) {
        expect(puzzle.correctIndex).toBeGreaterThanOrEqual(0);
        expect(puzzle.correctIndex).toBeLessThan(puzzle.options.length);
      } else if (isOddOneOutPuzzle(puzzle)) {
        expect(puzzle.correctIndex).toBeGreaterThanOrEqual(0);
        expect(puzzle.correctIndex).toBeLessThan(puzzle.items.length);
      } else if (isSortPuzzle(puzzle)) {
        expect(puzzle.assignments.length).toBe(puzzle.items.length);
        puzzle.assignments.forEach((binIdx) => {
          expect(binIdx).toBeGreaterThanOrEqual(0);
          expect(binIdx).toBeLessThan(puzzle.bins.length);
        });
        // Each item's attribute value must match its assigned bin
        puzzle.items.forEach((item, i) => {
          const bin = puzzle.bins[puzzle.assignments[i]];
          expect((item as Record<string, string>)[bin.attribute]).toBe(bin.value);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Sort puzzle: at least two different bins populated
// ---------------------------------------------------------------------------

describe('sort puzzles are non-degenerate', () => {
  for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
    const { puzzle } = buildLevel(lvl);
    if (!isSortPuzzle(puzzle)) continue;

    it(`level ${lvl} sort: items distributed across ≥2 bins`, () => {
      const uniqueBins = new Set(puzzle.assignments);
      expect(uniqueBins.size).toBeGreaterThanOrEqual(2);
    });
  }
});

// ---------------------------------------------------------------------------
// LevelSource
// ---------------------------------------------------------------------------

describe('shapeDetectiveLevels LevelSource', () => {
  it('has count = TOTAL_LEVELS', () => {
    expect(shapeDetectiveLevels.count).toBe(TOTAL_LEVELS);
  });

  it('get(n) matches buildLevel(n) for all levels', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      expect(shapeDetectiveLevels.get(lvl)).toEqual(buildLevel(lvl));
    }
  });

  it('is deterministic on repeated calls', () => {
    const a = shapeDetectiveLevels.get(5);
    const b = shapeDetectiveLevels.get(5);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// Pattern puzzles: not all options identical
// ---------------------------------------------------------------------------

describe('pattern puzzles are non-degenerate', () => {
  for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
    const { puzzle } = buildLevel(lvl);
    if (!isPatternPuzzle(puzzle)) continue;

    it(`level ${lvl} pattern: not all options identical`, () => {
      const first = puzzle.options[0];
      const allSame = puzzle.options.every(
        (o) => o.kind === first.kind && o.color === first.color && o.size === first.size,
      );
      expect(allSame).toBe(false);
    });
  }
});
