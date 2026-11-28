import bundled from '@/content/config.json';
import { SAFE_DEFAULT, validateContentConfig, isIsoDate, MAX_MOMENTS_PER_JOURNEY, MIN_MOMENT_EVERY } from '../validate';
import type { AppContentConfig } from '../types';

const valid = (): AppContentConfig => ({
  schemaVersion: 1,
  revision: 'test.1',
  catalogue: { order: ['count-and-pop', 'mouse-maze'], hidden: ['turbo-road'], enabled: ['new-game'] },
  themes: { force: null, dates: { ramadan: [{ start: '2027-02-08', end: '2027-03-09' }] } },
  moments: { enabled: true, every: 4, maxPerJourney: 2, types: ['ayah', 'howto'] },
});

/** A valid config with one section field replaced. */
function withPart<S extends 'catalogue' | 'themes' | 'moments'>(section: S, patch: Record<string, unknown>): unknown {
  const c = valid();
  return { ...c, [section]: { ...c[section], ...patch } };
}

describe('validateContentConfig', () => {
  // protects=a well-formed config applies exactly as written; fails_when=valid fields are altered or flagged; no_claim=none beyond protects
  it('keeps a valid config unchanged with no problems', () => {
    const { config, problems } = validateContentConfig(valid());
    expect(config).toEqual(valid());
    expect(problems).toEqual([]);
  });

  // protects=the shipped config.json is clean, so the app never reports an error at startup; fails_when=someone commits an invalid bundled config; no_claim=says nothing about configs fetched later
  it('accepts the bundled config.json cleanly', () => {
    expect(validateContentConfig(bundled).problems).toEqual([]);
  });

  // protects=a broken document can never change what the app shows; fails_when=a non-object, wrong version or missing section yields anything but SAFE_DEFAULT; no_claim=does not cover JSON parse errors (phase 2 fetch)
  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'hello'],
    ['schemaVersion 2', { ...valid(), schemaVersion: 2 }],
    ['no schemaVersion', { ...valid(), schemaVersion: undefined }],
    ['missing catalogue', { ...valid(), catalogue: undefined }],
    ['themes not an object', { ...valid(), themes: [] }],
    ['missing moments', { ...valid(), moments: null }],
  ])('falls back to SAFE_DEFAULT for %s', (_label, input) => {
    const { config, problems } = validateContentConfig(input);
    expect(config).toBe(SAFE_DEFAULT);
    expect(problems).toHaveLength(1);
  });

  // protects=one bad id never discards the whole catalogue; fails_when=good ids are lost or bad ids survive; no_claim=does not check ids exist in the registry (child B ignores unknown ids)
  it('drops non-string ids and duplicates but keeps the rest', () => {
    const { config, problems } = validateContentConfig(withPart('catalogue', { order: ['a', 3, '', 'b', 'a'], hidden: 'x' }));
    expect(config.catalogue.order).toEqual(['a', 'b']);
    expect(config.catalogue.hidden).toEqual([]);
    expect(config.catalogue.enabled).toEqual(['new-game']);
    expect(problems).toHaveLength(3); // 3 and '' dropped, hidden not an array
  });

  // protects=a missing optional list means "none", not an error; fails_when=absent lists are flagged; no_claim=none beyond protects
  it('treats missing catalogue lists as empty without problems', () => {
    const { config, problems } = validateContentConfig({ ...valid(), catalogue: {} });
    expect(config.catalogue).toEqual({ order: [], hidden: [], enabled: [] });
    expect(problems).toEqual([]);
  });

  // protects=only known theme values can force a theme; fails_when=an unknown force value is kept; no_claim=does not test theme selection (child C)
  it('accepts null, none and occasion ids for force, and drops anything else', () => {
    expect(validateContentConfig(withPart('themes', { force: 'none' })).config.themes.force).toBe('none');
    expect(validateContentConfig(withPart('themes', { force: 'eid-al-adha' })).config.themes.force).toBe('eid-al-adha');
    const bad = validateContentConfig(withPart('themes', { force: 'christmas' }));
    expect(bad.config.themes.force).toBeNull();
    expect(bad.problems).toHaveLength(1);
  });

  // protects=bad date windows can't switch a theme on at the wrong time; fails_when=an impossible, reversed or malformed window survives, or valid ones are lost; no_claim=does not verify windows match the Hijri calendar
  it('drops invalid date windows and unknown occasions', () => {
    const { config, problems } = validateContentConfig(
      withPart('themes', {
        dates: {
          ramadan: [
            { start: '2027-02-08', end: '2027-03-09' },
            { start: '2027-03-09', end: '2027-02-08' }, // reversed
            { start: '2027-02-30', end: '2027-03-01' }, // no such day
            { start: '2027-2-8', end: '2027-03-01' }, // bad format
          ],
          'eid-al-fitr': 'soon',
          mawlid: [{ start: '2027-08-15', end: '2027-08-15' }],
        },
      }),
    );
    expect(config.themes.dates).toEqual({ ramadan: [{ start: '2027-02-08', end: '2027-03-09' }] });
    expect(problems).toHaveLength(5);
  });

  // protects=moment cadence stays within the limits the journey supports; fails_when=every < 2 or maxPerJourney outside 0..5 gets through; no_claim=does not test insertion (child D)
  it('clamps moment numbers into range', () => {
    const low = validateContentConfig(withPart('moments', { every: 1, maxPerJourney: -3 }));
    expect(low.config.moments.every).toBe(MIN_MOMENT_EVERY);
    expect(low.config.moments.maxPerJourney).toBe(0);
    const high = validateContentConfig(withPart('moments', { maxPerJourney: 99 }));
    expect(high.config.moments.maxPerJourney).toBe(MAX_MOMENTS_PER_JOURNEY);
    expect(low.problems).toHaveLength(2);
    expect(high.problems).toHaveLength(1);
  });

  // protects=wrongly typed moment fields fall back to safe values; fails_when=a non-boolean enabled turns moments on or unknown types survive; no_claim=none beyond protects
  it('defaults wrongly typed moment fields and drops unknown types', () => {
    const { config, problems } = validateContentConfig(
      withPart('moments', { enabled: 'yes', every: 'four', types: ['ayah', 'poem', 'ayah'] }),
    );
    expect(config.moments.enabled).toBe(false);
    expect(config.moments.every).toBe(SAFE_DEFAULT.moments.every);
    expect(config.moments.types).toEqual(['ayah']);
    expect(problems).toHaveLength(3);
  });

  // protects=a bad revision doesn't throw away an otherwise good config; fails_when=the config falls back or keeps the bad value; no_claim=none beyond protects
  it('defaults a missing revision but keeps the rest', () => {
    const { config, problems } = validateContentConfig({ ...valid(), revision: '' });
    expect(config.revision).toBe(SAFE_DEFAULT.revision);
    expect(config.catalogue).toEqual(valid().catalogue);
    expect(problems).toHaveLength(1);
  });
});

describe('isIsoDate', () => {
  // protects=only real calendar dates count; fails_when=Feb 30 or a non-padded date passes, or a leap day fails; no_claim=none beyond protects
  it('accepts real dates only', () => {
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2027-02-29')).toBe(false);
    expect(isIsoDate('2027-13-01')).toBe(false);
    expect(isIsoDate('2027-1-01')).toBe(false);
    expect(isIsoDate(20270101)).toBe(false);
  });
});
