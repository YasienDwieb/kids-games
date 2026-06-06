import { sortSavedNewestFirst, isVerticalDrag } from '../savedStrip';
import type { SavedColor } from '../../types';

const mk = (id: string, createdAt: number): SavedColor => ({
  id,
  name: id,
  hex: '#123456',
  rgb: { r: 18, g: 52, b: 86 },
  createdAt,
});

describe('sortSavedNewestFirst', () => {
  it('orders by createdAt descending without mutating the input', () => {
    const input = [mk('a', 100), mk('b', 300), mk('c', 200)];
    const out = sortSavedNewestFirst(input);
    expect(out.map((c) => c.id)).toEqual(['b', 'c', 'a']);
    expect(input.map((c) => c.id)).toEqual(['a', 'b', 'c']); // original untouched
  });

  it('returns an empty array unchanged', () => {
    expect(sortSavedNewestFirst([])).toEqual([]);
  });
});

describe('isVerticalDrag', () => {
  it('is true for a clear upward drag', () => {
    expect(isVerticalDrag(2, -40)).toBe(true);
  });
  it('is false for a horizontal swipe (let the strip scroll)', () => {
    expect(isVerticalDrag(40, -3)).toBe(false);
  });
  it('is false for a tiny movement (a tap)', () => {
    expect(isVerticalDrag(1, -4)).toBe(false);
  });
});
