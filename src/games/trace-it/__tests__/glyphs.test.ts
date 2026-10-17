import { getEmojiImage } from '@/sdk/assets/emoji/images';
import { ALL_SETS } from '../glyphs';
import { WARMUPS, warmupFor } from '../glyphs/warmup';
import type { Glyph, Pt } from '../types';
import { prepareGlyph } from '../utils/resample';

const ALL: Glyph[] = Object.values(ALL_SETS).flat();

function pointsOf(g: Glyph): Pt[] {
  return g.strokes.flatMap((s) => (s.kind === 'dot' ? [s.at] : [...s.points]));
}

function firstPath(g: Glyph): readonly Pt[] {
  const s = g.strokes.find((st) => st.kind === 'path');
  if (!s || s.kind !== 'path') throw new Error(`${g.id} has no path`);
  return s.points;
}

function lastPath(g: Glyph): readonly Pt[] {
  const paths = g.strokes.filter((st) => st.kind === 'path');
  const s = paths[paths.length - 1];
  if (!s || s.kind !== 'path') throw new Error(`${g.id} has no path`);
  return s.points;
}

describe('glyph sets', () => {
  it('registers the digit and warm-up sets', () => {
    expect(Object.keys(ALL_SETS)).toEqual(expect.arrayContaining(['digits', 'warmup']));
    expect(ALL_SETS.digits.map((g) => g.id)).toEqual(
      ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9'],
    );
    expect(ALL_SETS.warmup.map((g) => g.id)).toEqual(
      ['line', 'zigzag', 'wave', 'arch', 'loops', 'spiral', 'circle'],
    );
  });

  it.each(ALL.map((g) => [g.id, g] as const))('%s has at least one path stroke', (_id, g) => {
    expect(g.strokes.some((s) => s.kind === 'path')).toBe(true);
  });

  it.each(ALL.map((g) => [g.id, g] as const))('%s stays inside the 100x100 box', (_id, g) => {
    for (const [x, y] of pointsOf(g)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
  });

  it.each(ALL.map((g) => [g.id, g] as const))('%s has no gap > 3 after prepareGlyph', (_id, g) => {
    for (const s of prepareGlyph(g).strokes) {
      if (s.kind !== 'path') continue;
      for (let i = 1; i < s.points.length; i++) {
        const [ax, ay] = s.points[i - 1];
        const [bx, by] = s.points[i];
        expect(Math.hypot(bx - ax, by - ay)).toBeLessThanOrEqual(3);
      }
    }
  });

  it.each(ALL.map((g) => [g.id, g] as const))('%s has no path after a dot', (_id, g) => {
    const firstDot = g.strokes.findIndex((s) => s.kind === 'dot');
    if (firstDot === -1) return;
    expect(g.strokes.slice(firstDot).every((s) => s.kind === 'dot')).toBe(true);
  });

  it.each(Object.entries(ALL_SETS))('%s ids are unique', (_name, glyphs) => {
    const ids = glyphs.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('digits', () => {
  it('use one stroke each, except 4 and 5 with two', () => {
    for (const g of ALL_SETS.digits) {
      expect(g.strokes).toHaveLength(g.id === 'd4' || g.id === 'd5' ? 2 : 1);
    }
  });

  it('stay within x 25-75, y 10-90', () => {
    for (const g of ALL_SETS.digits) {
      for (const [x, y] of pointsOf(g)) {
        expect(x).toBeGreaterThanOrEqual(25 - 1e-9);
        expect(x).toBeLessThanOrEqual(75 + 1e-9);
        expect(y).toBeGreaterThanOrEqual(10 - 1e-9);
        expect(y).toBeLessThanOrEqual(90 + 1e-9);
      }
    }
  });
});

describe('warm-ups', () => {
  it('stay within y 25-75', () => {
    for (const g of WARMUPS) {
      for (const [, y] of pointsOf(g)) {
        expect(y).toBeGreaterThanOrEqual(25 - 1e-9);
        expect(y).toBeLessThanOrEqual(75 + 1e-9);
      }
    }
  });

  it.each(WARMUPS.map((w) => [w.id, w.from, w.to] as const))(
    '%s uses bundled emoji %s -> %s',
    (_id, from, to) => {
      for (const e of [from, to]) {
        expect(['🐷', '🐖', '🍑']).not.toContain(e);
        expect(getEmojiImage(e)).toBeDefined();
      }
    },
  );

  it.each(WARMUPS.filter((w) => w.id !== 'circle').map((w) => [w.id] as const))(
    '%s runs left-to-right in LTR and right-to-left in RTL',
    (id) => {
      const ltr = warmupFor(id, false);
      const rtl = warmupFor(id, true);
      expect(ltr.fromSide).toBe('left');
      expect(rtl.fromSide).toBe('right');
      expect(firstPath(ltr.glyph)[0][0]).toBeLessThan(lastPath(ltr.glyph).at(-1)![0]);
      expect(firstPath(rtl.glyph)[0][0]).toBeGreaterThan(lastPath(rtl.glyph).at(-1)![0]);
    },
  );

  it('mirrors the circle start under RTL', () => {
    const ltr = warmupFor('circle', false);
    const rtl = warmupFor('circle', true);
    expect(ltr.fromSide).toBe('left');
    expect(rtl.fromSide).toBe('right');
    const x = firstPath(ltr.glyph)[0][0];
    expect(x).not.toBeCloseTo(50);
    expect(firstPath(rtl.glyph)[0][0]).toBeCloseTo(100 - x);
  });

  it('throws on an unknown warm-up id', () => {
    expect(() => warmupFor('nope', false)).toThrow();
  });
});
