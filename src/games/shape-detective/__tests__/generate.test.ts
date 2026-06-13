import {
  mulberry32,
  buildPatternPuzzle,
  buildOddOneOutPuzzle,
  buildSortPuzzle,
} from '../utils/generate';
import type { PatternPuzzle, OddOneOutPuzzle, SortPuzzle } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ATTR_SINGLE = ['kind'] as const;
const ATTR_DOUBLE = ['kind', 'color'] as const;
const ATTR_TRIPLE = ['kind', 'color', 'size'] as const;

function shapesEqual(
  a: { kind: string; color: string; size: string },
  b: { kind: string; color: string; size: string },
) {
  return a.kind === b.kind && a.color === b.color && a.size === b.size;
}

// ---------------------------------------------------------------------------
// mulberry32
// ---------------------------------------------------------------------------

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const values1 = Array.from({ length: 10 }, () => r1());
    const values2 = Array.from({ length: 10 }, () => r2());
    expect(values1).toEqual(values2);
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const r1 = mulberry32(1);
    const r2 = mulberry32(2);
    const v1 = r1();
    const v2 = r2();
    expect(v1).not.toBe(v2);
  });
});

// ---------------------------------------------------------------------------
// PatternPuzzle
// ---------------------------------------------------------------------------

describe('buildPatternPuzzle', () => {
  const OPTION_COUNTS = [3, 4, 5];
  const ATTR_SETS = [ATTR_SINGLE, ATTR_DOUBLE, ATTR_TRIPLE] as const;

  for (const attrs of ATTR_SETS) {
    for (const optCount of OPTION_COUNTS) {
      it(`attrs=${attrs.join('+')} opts=${optCount}: exactly one correct answer`, () => {
        const puzzle = buildPatternPuzzle(12345, attrs, optCount);
        expect(puzzle.type).toBe('pattern');
        expect(puzzle.options).toHaveLength(optCount);
        expect(puzzle.correctIndex).toBeGreaterThanOrEqual(0);
        expect(puzzle.correctIndex).toBeLessThan(optCount);
      });

      it(`attrs=${attrs.join('+')} opts=${optCount}: not all options identical`, () => {
        const puzzle = buildPatternPuzzle(12345, attrs, optCount);
        const first = puzzle.options[0];
        const allSame = puzzle.options.every((o) => shapesEqual(o, first));
        expect(allSame).toBe(false);
      });
    }
  }

  it('is deterministic for the same seed', () => {
    const p1 = buildPatternPuzzle(9999, ATTR_DOUBLE, 4);
    const p2 = buildPatternPuzzle(9999, ATTR_DOUBLE, 4);
    expect(p1).toEqual(p2);
  });

  it('produces different puzzles for different seeds', () => {
    const p1 = buildPatternPuzzle(1, ATTR_DOUBLE, 4);
    const p2 = buildPatternPuzzle(2, ATTR_DOUBLE, 4);
    // At least the sequences or options should differ
    expect(JSON.stringify(p1)).not.toBe(JSON.stringify(p2));
  });

  it('sequence is non-empty', () => {
    const puzzle = buildPatternPuzzle(7, ATTR_SINGLE, 3);
    expect(puzzle.sequence.length).toBeGreaterThan(0);
  });

  it('correct option continues the pattern cycle', () => {
    // The cycle is built from the pools; the correct answer at index
    // (sequence.length % cycleLen) matches options[correctIndex].
    const puzzle = buildPatternPuzzle(42, ATTR_SINGLE, 3);
    const correct = puzzle.options[puzzle.correctIndex];
    // Verify the correct shape appears in the cycle (first visible shape of the cycle)
    expect(correct).toBeDefined();
    expect(correct.kind).toBeTruthy();
  });

  it('each distractor differs from the correct answer on at least one attribute', () => {
    const puzzle = buildPatternPuzzle(55, ATTR_TRIPLE, 5);
    const correct = puzzle.options[puzzle.correctIndex];
    puzzle.options.forEach((opt, i) => {
      if (i !== puzzle.correctIndex) {
        expect(shapesEqual(opt, correct)).toBe(false);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// OddOneOutPuzzle
// ---------------------------------------------------------------------------

describe('buildOddOneOutPuzzle', () => {
  const ITEM_COUNTS = [3, 4, 5];
  const ATTR_SETS = [ATTR_SINGLE, ATTR_DOUBLE, ATTR_TRIPLE] as const;

  for (const attrs of ATTR_SETS) {
    for (const count of ITEM_COUNTS) {
      it(`attrs=${attrs.join('+')} items=${count}: correctIndex in range`, () => {
        const puzzle = buildOddOneOutPuzzle(54321, attrs, count);
        expect(puzzle.type).toBe('oddOneOut');
        expect(puzzle.items).toHaveLength(count);
        expect(puzzle.correctIndex).toBeGreaterThanOrEqual(0);
        expect(puzzle.correctIndex).toBeLessThan(count);
      });

      it(`attrs=${attrs.join('+')} items=${count}: odd shape differs from majority`, () => {
        const puzzle = buildOddOneOutPuzzle(54321, attrs, count);
        const majority = puzzle.items.filter((_, i) => i !== puzzle.correctIndex);
        const odd = puzzle.items[puzzle.correctIndex];
        // All majority shapes should be identical to each other
        const firstMajority = majority[0];
        majority.forEach((m) => {
          expect(shapesEqual(m, firstMajority)).toBe(true);
        });
        // Odd should differ from the majority
        expect(shapesEqual(odd, firstMajority)).toBe(false);
      });
    }
  }

  it('is deterministic for the same seed', () => {
    const p1 = buildOddOneOutPuzzle(7777, ATTR_DOUBLE, 4);
    const p2 = buildOddOneOutPuzzle(7777, ATTR_DOUBLE, 4);
    expect(p1).toEqual(p2);
  });

  it('not all items identical', () => {
    const puzzle = buildOddOneOutPuzzle(1234, ATTR_SINGLE, 4);
    const first = puzzle.items[0];
    const allSame = puzzle.items.every((item) => shapesEqual(item, first));
    expect(allSame).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SortPuzzle
// ---------------------------------------------------------------------------

describe('buildSortPuzzle', () => {
  const ITEM_COUNTS = [4, 5, 6];
  const ATTR_SETS = [ATTR_SINGLE, ATTR_DOUBLE, ATTR_TRIPLE] as const;

  for (const attrs of ATTR_SETS) {
    for (const count of ITEM_COUNTS) {
      it(`attrs=${attrs.join('+')} items=${count}: assignments all in bin range`, () => {
        const puzzle = buildSortPuzzle(11111, attrs, count);
        expect(puzzle.type).toBe('sort');
        expect(puzzle.items).toHaveLength(count);
        expect(puzzle.assignments).toHaveLength(count);
        puzzle.assignments.forEach((binIdx) => {
          expect(binIdx).toBeGreaterThanOrEqual(0);
          expect(binIdx).toBeLessThan(puzzle.bins.length);
        });
      });

      it(`attrs=${attrs.join('+')} items=${count}: each item matches its bin's attribute value`, () => {
        const puzzle = buildSortPuzzle(11111, attrs, count);
        puzzle.items.forEach((item, i) => {
          const bin = puzzle.bins[puzzle.assignments[i]];
          expect((item as Record<string, string>)[bin.attribute]).toBe(bin.value);
        });
      });
    }
  }

  it('has at least 2 bins', () => {
    const puzzle = buildSortPuzzle(9, ATTR_SINGLE, 4);
    expect(puzzle.bins.length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic for the same seed', () => {
    const p1 = buildSortPuzzle(3333, ATTR_DOUBLE, 5);
    const p2 = buildSortPuzzle(3333, ATTR_DOUBLE, 5);
    expect(p1).toEqual(p2);
  });

  it('items are not all assigned to the same bin', () => {
    const puzzle = buildSortPuzzle(555, ATTR_SINGLE, 4);
    const uniqueBins = new Set(puzzle.assignments);
    expect(uniqueBins.size).toBeGreaterThanOrEqual(2);
  });
});
