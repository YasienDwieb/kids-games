import { segmentsFor, toBox } from '../utils/segments';

describe('segmentsFor', () => {
  it('places a horizontal segment centred on its midpoint', () => {
    expect(segmentsFor([[0, 0], [10, 0]], 2, 4)).toEqual([
      { left: 0, top: -2, length: 20, thickness: 4, angle: 0 },
    ]);
  });

  it('rotates a vertical segment by 90 degrees', () => {
    const [seg] = segmentsFor([[0, 0], [0, 10]], 2, 4);
    expect(seg.angle).toBe(90);
    expect(seg.length).toBe(20);
    expect(seg.left).toBe(-10);
    expect(seg.top).toBe(8);
  });

  it('gives one segment per consecutive pair', () => {
    expect(segmentsFor([[0, 0], [10, 0], [10, 10]], 1, 2)).toHaveLength(2);
    expect(segmentsFor([[5, 5]], 1, 2)).toEqual([]);
  });
});

describe('toBox', () => {
  it('maps board pixels into 0..100 box units past the pad', () => {
    expect(toBox(110, 10, 220, 10)).toEqual([50, 0]);
  });
});
