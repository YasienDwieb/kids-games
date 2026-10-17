import { getEmojiImage } from '@/sdk/assets/emoji/images';
import { blockComplete, charsFor, nextSuggested, roundSteps } from '../catalog';
import { charStars, progressStore, recordStars } from '../progress';
import type { Track } from '../types';

describe('catalog', () => {
  it('latin letters are in school order', () => {
    const c = charsFor('letters', 'latin');
    expect(c).toHaveLength(26);
    expect(c.slice(0, 13).map((x) => x.label).join(' ')).toBe('T I S A N P H D R E C K M');
  });

  it('arabic letters are in school order', () => {
    const c = charsFor('letters', 'arabic');
    expect(c).toHaveLength(28);
    expect(c.slice(0, 3).map((x) => x.id)).toEqual(['alef', 'baa', 'meem']);
  });

  it('ids are unique within each list and never shared across tracks', () => {
    const trackOf = new Map<string, Track>();
    for (const t of ['warmup', 'letters', 'numbers'] as Track[]) {
      for (const s of ['latin', 'arabic'] as const) {
        const ids = charsFor(t, s).map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) {
          expect(trackOf.get(id) ?? t).toBe(t);
          trackOf.set(id, t);
        }
      }
    }
    expect(trackOf.size).toBe(26 + 28 + 10 + charsFor('warmup', 'latin').length);
  });

  it('latin full round is upper, lower guided then solo', () => {
    const T = charsFor('letters', 'latin')[0];
    const steps = roundSteps(T, 'full');
    expect(steps.map((s) => s.pass)).toEqual(['guided', 'guided', 'solo', 'solo']);
    expect(steps.map((s) => s.glyph.id)).toEqual(['T', 't', 'T', 't']);
  });

  it('other tracks and guidedOnly', () => {
    const d = charsFor('numbers', 'latin')[0];
    expect(roundSteps(d, 'full').map((s) => s.pass)).toEqual(['guided', 'solo']);
    expect(roundSteps(d, 'guidedOnly')).toHaveLength(1);
    const w = charsFor('warmup', 'arabic')[0];
    expect(roundSteps(w, 'full')).toHaveLength(1);
    expect(w.fromSide).toBe('right');
    expect(w.id.startsWith('w:')).toBe(true);
  });

  it('digits are 1-9 then 0 with counts and resolvable emoji', () => {
    const d = charsFor('numbers', 'latin');
    expect(d.map((x) => x.label).join('')).toBe('1234567890');
    expect(d[9].count).toBe(0);
    for (const x of d) expect(getEmojiImage(x.emoji!)).toBeTruthy();
  });

  it('suggests the first unfinished character', () => {
    const c = charsFor('letters', 'latin');
    expect(nextSuggested(c, { T: 3, I: 1 })).toBe('S');
    expect(nextSuggested(c, Object.fromEntries(c.map((x) => [x.id, 1])))).toBeUndefined();
  });

  it('a letter block is the taught school-order head; digits and warm-ups are the whole track', () => {
    const taught = { T: 1, I: 2, S: 3, A: 1, N: 1, P: 1, H: 1, D: 1, R: 1, E: 1, C: 1, K: 1 };
    expect(blockComplete('letters', 'latin', taught)).toBe(false);
    expect(blockComplete('letters', 'latin', { ...taught, M: 2 })).toBe(true);
    const ar = ['alef', 'baa', 'meem', 'haa', 'jeem', 'dal', 'khaa', 'taa', 'lam', 'seen', 'noon'];
    expect(blockComplete('letters', 'arabic', Object.fromEntries(ar.map((id) => [id, 1])))).toBe(true);
    expect(blockComplete('letters', 'latin', Object.fromEntries(ar.map((id) => [id, 1])))).toBe(false);
    const digits = charsFor('numbers', 'latin').map((c) => c.id);
    expect(blockComplete('numbers', 'latin', Object.fromEntries(digits.slice(1).map((id) => [id, 1])))).toBe(false);
    expect(blockComplete('numbers', 'latin', Object.fromEntries(digits.map((id) => [id, 1])))).toBe(true);
    const warm = charsFor('warmup', 'arabic').map((c) => c.id);
    expect(blockComplete('warmup', 'arabic', Object.fromEntries(warm.map((id) => [id, 3])))).toBe(true);
    expect(blockComplete('warmup', 'arabic', {})).toBe(false);
  });
});

describe('progress', () => {
  it('charStars is the min, 3 when empty', () => {
    expect(charStars([3, 1, 2])).toBe(1);
    expect(charStars([])).toBe(3);
  });

  it('recordStars keeps the max', async () => {
    await recordStars('T', 3);
    await recordStars('T', 1);
    expect((await progressStore.get()).done.T).toBe(3);
  });
});
