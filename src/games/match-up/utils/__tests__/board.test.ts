import { nearestLooseIndex, lineColorFor } from '../board';

type Rect = { x: number; y: number; width: number; height: number };
const r = (x: number, y: number): Rect => ({ x, y, width: 80, height: 80 });

describe('nearestLooseIndex', () => {
  it('returns the index of the closest rect by center distance', () => {
    const rects = [r(0, 0), r(200, 0), r(400, 0)];
    // point near the middle tile's center (240,40)
    expect(nearestLooseIndex(rects, { x: 235, y: 45 }, 200)).toBe(1);
  });

  it('skips null (already matched) rects', () => {
    // Centers: idx0=(40,40), idx1=(240,40), idx2=(440,40).
    // Point (200,40) is geometrically closest to idx1 (distance 40) — null it out;
    // next-closest is idx0 (distance 160), not idx2 (distance 240), so result must be 0.
    const rects = [r(0, 0), null, r(400, 0)];
    expect(nearestLooseIndex(rects, { x: 200, y: 40 }, 1000)).toBe(0);
  });

  it('returns -1 when nothing is within maxDist', () => {
    const rects = [r(0, 0)];
    expect(nearestLooseIndex(rects, { x: 1000, y: 1000 }, 50)).toBe(-1);
  });

  it('returns -1 for an all-null list', () => {
    expect(nearestLooseIndex([null, null], { x: 0, y: 0 }, 100)).toBe(-1);
  });
});

describe('lineColorFor', () => {
  const palette = ['a', 'b', 'c'];
  it('returns the palette color for the index', () => {
    expect(lineColorFor(0, palette)).toBe('a');
    expect(lineColorFor(2, palette)).toBe('c');
  });
  it('cycles when the index exceeds the palette length', () => {
    expect(lineColorFor(3, palette)).toBe('a');
    expect(lineColorFor(4, palette)).toBe('b');
  });
});
