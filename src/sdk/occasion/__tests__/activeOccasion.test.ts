import { activeOccasion, localToday, windowsFor } from '../activeOccasion';
import { OCCASION_TABLE } from '../dates.generated';
import { OCCASION_IDS, type OccasionId, type ThemesConfig } from '@/sdk/content/types';

const byDate: ThemesConfig = { force: null, dates: {} };
const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

describe('activeOccasion: bundled table edges', () => {
  const cases = OCCASION_IDS.flatMap((id) => OCCASION_TABLE[id].map((w) => [id, w.start, w.end] as const));

  // protects=every occasion switches on exactly on its first day and off the day after its last, for all 8 years; fails_when=an off-by-one window or a gap between table and logic; no_claim=does not prove the table matches moon sighting (generated from Umm al-Qura; config overrides cover that)
  it.each(cases)('%s %s..%s is active on both edges only', (id, start, end) => {
    expect(activeOccasion(start, byDate)).toBe(id);
    expect(activeOccasion(end, byDate)).toBe(id);
    expect(activeOccasion(shift(start, -1), byDate)).not.toBe(id);
    expect(activeOccasion(shift(end, 1), byDate)).not.toBe(id);
  });

  // protects=8 years of each occasion are bundled; fails_when=the generator drops a year; no_claim=none beyond protects
  it('covers 8 years per occasion', () => {
    OCCASION_IDS.forEach((id) => expect(OCCASION_TABLE[id]).toHaveLength(8));
  });

  // protects=1448 anchors match the Umm al-Qura calendar; fails_when=a regeneration shifts Ramadan 1448 or its Eid; no_claim=a spot check of one year, not all
  it('has Ramadan 1448 from 2027-02-08 and Eid al-Fitr on 2027-03-09', () => {
    expect(OCCASION_TABLE.ramadan[0].start).toBe('2027-02-08');
    expect(OCCASION_TABLE['eid-al-fitr'][0].start).toBe('2027-03-09');
  });

  // protects=ordinary days get no theme; fails_when=a date outside every window themes the app; no_claim=none beyond protects
  it('returns null outside every window', () => {
    expect(activeOccasion('2027-07-01', byDate)).toBeNull();
  });
});

describe('activeOccasion: config', () => {
  // protects=a grown-up can turn themes off even mid-Ramadan; fails_when=force 'none' still themes; no_claim=none beyond protects
  it("force 'none' wins inside a window", () => {
    expect(activeOccasion('2027-02-15', { force: 'none', dates: {} })).toBeNull();
  });

  // protects=a theme can be previewed or forced out of season; fails_when=force is ignored; no_claim=none beyond protects
  it('force picks a theme out of season', () => {
    expect(activeOccasion('2027-07-01', { force: 'eid-al-fitr', dates: {} })).toBe('eid-al-fitr');
  });

  // protects=a moon-sighting override replaces that year's table window and keeps other years; fails_when=both windows apply or other years are lost; no_claim=none beyond protects
  it('a dates override replaces the same-year table window only', () => {
    const themes: ThemesConfig = { force: null, dates: { ramadan: [{ start: '2027-02-09', end: '2027-03-09' }] } };
    expect(activeOccasion('2027-02-08', themes)).toBeNull();
    expect(activeOccasion('2027-02-09', themes)).toBe('ramadan');
    expect(windowsFor('ramadan', themes.dates)).toHaveLength(8);
    expect(activeOccasion('2028-01-28', themes)).toBe('ramadan');
  });

  // protects=when an override makes Eid overlap Ramadan's last day, the child sees Eid; fails_when=Ramadan wins the overlap; no_claim=none beyond protects
  it('prefers Eid where windows overlap', () => {
    const themes: ThemesConfig = { force: null, dates: { 'eid-al-fitr': [{ start: '2027-03-08', end: '2027-03-10' }] } };
    expect(activeOccasion('2027-03-08', themes)).toBe<OccasionId>('eid-al-fitr');
  });
});

describe('localToday', () => {
  // protects=the device-local calendar day is used, not UTC; fails_when=late evening in UTC+3 reports tomorrow's or yesterday's date; no_claim=runs in the test machine's time zone only
  it('formats the local date', () => {
    expect(localToday(new Date(2027, 1, 8, 23, 30))).toBe('2027-02-08');
    expect(localToday(new Date(2027, 0, 5, 0, 5))).toBe('2027-01-05');
  });
});
