import { levelsFromList, levelsFromGenerator } from '../source';

describe('levelsFromList', () => {
  it('returns the item for a 1-based level', () => {
    const src = levelsFromList(['a', 'b', 'c']);
    expect(src.get(1)).toBe('a');
    expect(src.get(3)).toBe('c');
  });

  it('reports a finite count', () => {
    expect(levelsFromList(['a', 'b']).count).toBe(2);
  });

  it('throws for an out-of-range level', () => {
    const src = levelsFromList(['a']);
    expect(() => src.get(2)).toThrow(RangeError);
    expect(() => src.get(0)).toThrow(RangeError);
  });
});

describe('levelsFromGenerator', () => {
  it('calls the generator with the level number', () => {
    const src = levelsFromGenerator((lvl) => lvl * 10);
    expect(src.get(1)).toBe(10);
    expect(src.get(4)).toBe(40);
  });

  it('is endless by default (no count)', () => {
    expect(levelsFromGenerator((lvl) => lvl).count).toBeUndefined();
  });

  it('can be bounded with a count', () => {
    expect(levelsFromGenerator((lvl) => lvl, { count: 5 }).count).toBe(5);
  });
});
