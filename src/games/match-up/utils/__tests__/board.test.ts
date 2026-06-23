import { nearestLooseIndex } from '../board';

type Rect = { x: number; y: number; width: number; height: number };
const r = (x: number, y: number): Rect => ({ x, y, width: 80, height: 80 });

describe('nearestLooseIndex', () => {
  it('returns the index of the closest rect by center distance', () => {
    const rects = [r(0, 0), r(200, 0), r(400, 0)];
    // point near the middle tile's center (240,40)
    expect(nearestLooseIndex(rects, { x: 235, y: 45 }, 200)).toBe(1);
  });

  it('skips null (already matched) rects', () => {
    const rects = [r(0, 0), null, r(400, 0)];
    // point closer to tile 2's center (440,40) than tile 0's center (40,40)
    expect(nearestLooseIndex(rects, { x: 260, y: 40 }, 1000)).toBe(2);
  });

  it('returns -1 when nothing is within maxDist', () => {
    const rects = [r(0, 0)];
    expect(nearestLooseIndex(rects, { x: 1000, y: 1000 }, 50)).toBe(-1);
  });

  it('returns -1 for an all-null list', () => {
    expect(nearestLooseIndex([null, null], { x: 0, y: 0 }, 100)).toBe(-1);
  });
});
