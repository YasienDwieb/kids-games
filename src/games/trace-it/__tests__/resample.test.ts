import { arc, line, mirrorX, path, dot } from '../glyphs/build';
import { prepareGlyph, resample } from '../utils/resample';

describe('resample', () => {
  it('spaces a straight line evenly', () => {
    const r = resample(line([0, 0], [10, 0]));
    expect(r).toHaveLength(6);
    expect(r.map((p) => p[0])).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('keeps gaps <= 2 on a full circle and closes it', () => {
    const r = resample(arc(50, 50, 30, 0, 360));
    for (let i = 1; i < r.length; i++) {
      expect(Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1])).toBeLessThanOrEqual(2.0001);
    }
    const first = r[0];
    const last = r[r.length - 1];
    expect(Math.hypot(last[0] - first[0], last[1] - first[1])).toBeLessThan(0.01);
  });

  it('returns a single point unchanged', () => {
    expect(resample([[5, 5]])).toEqual([[5, 5]]);
  });

  it('prepareGlyph resamples paths and leaves dots', () => {
    const g = prepareGlyph({ id: 'x', strokes: [path(line([0, 0], [10, 0])), dot(1, 2)] });
    expect(g.strokes[0].kind === 'path' && g.strokes[0].points).toHaveLength(6);
    expect(g.strokes[1]).toEqual({ kind: 'dot', at: [1, 2] });
  });
});

describe('build', () => {
  it('mirrorX flips x and keeps stroke order', () => {
    const m = mirrorX({ id: 'a', strokes: [path(line([20, 30], [30, 40])), dot(10, 5)] });
    expect(m.strokes[0]).toEqual({ kind: 'path', points: [[80, 30], [70, 40]] });
    expect(m.strokes[1]).toEqual({ kind: 'dot', at: [90, 5] });
  });

  it('arc sweeps clockwise on screen', () => {
    const a = arc(50, 50, 10, 0, 90);
    const end = a[a.length - 1];
    expect(end[0]).toBeCloseTo(50);
    expect(end[1]).toBeCloseTo(60);
  });
});
