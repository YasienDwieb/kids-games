import { ARABIC_LETTERS, LATIN_LETTERS } from '@/games/_shared/letters';
import { getEmojiImage } from '@/sdk/assets/emoji/images';
import { ALL_SETS } from '../glyphs';
import { ARABIC_GLYPHS } from '../glyphs/arabic';
import { LATIN_LOWER, LATIN_UPPER } from '../glyphs/latin';
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

describe('latin', () => {
  it('has A-Z uppercase then a-z lowercase', () => {
    const upper = LATIN_LETTERS.map((l) => l.id);
    expect(LATIN_UPPER.map((g) => g.id)).toEqual(upper);
    expect(LATIN_LOWER.map((g) => g.id)).toEqual(upper.map((id) => id.toLowerCase()));
    expect(ALL_SETS.latin).toEqual([...LATIN_UPPER, ...LATIN_LOWER]);
  });

  it('uppercase stays within y 10-90', () => {
    for (const g of LATIN_UPPER) {
      for (const [, y] of pointsOf(g)) {
        expect(y).toBeGreaterThanOrEqual(10 - 1e-9);
        expect(y).toBeLessThanOrEqual(90 + 1e-9);
      }
    }
  });

  it('lowercase stays within y 10-98', () => {
    for (const g of LATIN_LOWER) {
      for (const [, y] of pointsOf(g)) {
        expect(y).toBeGreaterThanOrEqual(10 - 1e-9);
        expect(y).toBeLessThanOrEqual(98 + 1e-9);
      }
    }
  });

  it.each(['i', 'j'])('%s ends with a dot tittle', (id) => {
    const g = LATIN_LOWER.find((l) => l.id === id)!;
    expect(g.strokes.at(-1)!.kind).toBe('dot');
    expect(g.strokes.filter((s) => s.kind === 'dot')).toHaveLength(1);
  });

  it('only i and j use dots', () => {
    const dotted = [...LATIN_UPPER, ...LATIN_LOWER]
      .filter((g) => g.strokes.some((s) => s.kind === 'dot'))
      .map((g) => g.id);
    expect(dotted).toEqual(['i', 'j']);
  });
});

describe('arabic', () => {
  // د ر ز و start with a downstroke; ج ح خ start the head left to right (Ministry KG1 book).
  const START_EXEMPT = ['alef', 'dal', 'thal', 'raa', 'zay', 'waw', 'jeem', 'haa', 'khaa'];
  const DOTS: Record<string, number> = {
    baa: 1, taa: 2, thaa: 3, jeem: 1, khaa: 1, thal: 1, zay: 1, sheen: 3, dad: 1,
    thaa_heavy: 1, ghayn: 1, faa: 1, qaf: 2, noon: 1, yaa: 2,
  };

  it('has the inventory ids in order and is registered', () => {
    expect(ARABIC_GLYPHS.map((g) => g.id)).toEqual(ARABIC_LETTERS.map((l) => l.id));
    expect(ALL_SETS.arabic).toBe(ARABIC_GLYPHS);
  });

  it.each(ARABIC_GLYPHS.filter((g) => !START_EXEMPT.includes(g.id)).map((g) => [g.id, g] as const))(
    '%s starts its body on the right and travels left',
    (_id, g) => {
      const body = firstPath(g);
      expect(body[0][0]).toBeGreaterThanOrEqual(body.at(-1)![0]);
    },
  );

  it('alef is one stroke from top to bottom', () => {
    const g = ARABIC_GLYPHS.find((l) => l.id === 'alef')!;
    expect(g.strokes).toHaveLength(1);
    const body = firstPath(g);
    expect(body[0][1]).toBeLessThan(body.at(-1)![1]);
  });

  it.each(ARABIC_GLYPHS.map((g) => [g.id, DOTS[g.id] ?? 0] as const))('%s has %i dots', (id, n) => {
    const g = ARABIC_GLYPHS.find((l) => l.id === id)!;
    expect(g.strokes.filter((s) => s.kind === 'dot')).toHaveLength(n);
  });

  it('baa and taa share the anchored body', () => {
    const [baa, taa] = ['baa', 'taa'].map((id) => ARABIC_GLYPHS.find((l) => l.id === id)!);
    expect(firstPath(baa)[0]).toEqual([80, 45]);
    expect(firstPath(baa).at(-1)).toEqual([20, 50]);
    expect(firstPath(taa)).toEqual(firstPath(baa));
    expect(baa.strokes.slice(1)).toEqual([{ kind: 'dot', at: [50, 82] }]);
    expect(taa.strokes.slice(1)).toEqual([
      { kind: 'dot', at: [42, 30] },
      { kind: 'dot', at: [58, 30] },
    ]);
  });

  it('descenders stay within y 95', () => {
    for (const g of ARABIC_GLYPHS) {
      for (const [, y] of pointsOf(g)) expect(y).toBeLessThanOrEqual(95 + 1e-9);
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
