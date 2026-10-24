import { ARABIC_LETTERS, LATIN_LETTERS, SCHOOL_ORDER, schoolOrdered } from '..';

const ids = (xs: readonly { id: string }[]) => xs.map((l) => l.id);

describe('school order', () => {
  it('only references real letters, without duplicates', () => {
    const latin = new Set(ids(LATIN_LETTERS));
    const arabic = new Set(ids(ARABIC_LETTERS));
    SCHOOL_ORDER.latin.forEach((id) => expect(latin.has(id)).toBe(true));
    SCHOOL_ORDER.arabic.forEach((id) => expect(arabic.has(id)).toBe(true));
    expect(new Set(SCHOOL_ORDER.latin).size).toBe(SCHOOL_ORDER.latin.length);
    expect(new Set(SCHOOL_ORDER.arabic).size).toBe(SCHOOL_ORDER.arabic.length);
  });

  it('orders Latin letters taught-first, then the rest A-Z', () => {
    const out = ids(schoolOrdered(LATIN_LETTERS, SCHOOL_ORDER.latin));
    expect(out.slice(0, 13)).toEqual(['T', 'I', 'S', 'A', 'N', 'P', 'H', 'D', 'R', 'E', 'C', 'K', 'M']);
    expect(out).toHaveLength(26);
    expect(out[13]).toBe('B');
  });

  it('orders Arabic letters taught-first, then the rest', () => {
    const out = ids(schoolOrdered(ARABIC_LETTERS, SCHOOL_ORDER.arabic));
    expect(out.slice(0, 11)).toEqual(['alef', 'baa', 'meem', 'haa', 'jeem', 'dal', 'khaa', 'taa', 'lam', 'seen', 'noon']);
    expect(out).toHaveLength(28);
  });
});
