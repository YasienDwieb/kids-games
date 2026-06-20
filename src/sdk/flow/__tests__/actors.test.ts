import { makeActor, rowLayout } from '../actors';

describe('makeActor', () => {
  it('applies geometry defaults', () => {
    const a = makeActor({ id: 's1', x: 10, y: 20, content: null });
    expect(a).toMatchObject({ id: 's1', x: 10, y: 20, scale: 1, rotation: 0, opacity: 1 });
  });
  it('honors overrides', () => {
    const a = makeActor({ id: 's1', x: 0, y: 0, content: null, scale: 2, opacity: 0.5 });
    expect(a.scale).toBe(2);
    expect(a.opacity).toBe(0.5);
  });
});

describe('rowLayout', () => {
  it('centers a single point on cx', () => {
    expect(rowLayout(1, { cx: 100, cy: 50, gap: 80 })).toEqual([{ x: 100, y: 50 }]);
  });
  it('spaces points symmetrically around cx', () => {
    const pts = rowLayout(2, { cx: 100, cy: 50, gap: 80 });
    expect(pts).toEqual([{ x: 60, y: 50 }, { x: 140, y: 50 }]);
  });
  it('keeps all points on the same y', () => {
    const pts = rowLayout(4, { cx: 200, cy: 30, gap: 50 });
    expect(pts.every((p) => p.y === 30)).toBe(true);
    expect(pts).toHaveLength(4);
  });
});
