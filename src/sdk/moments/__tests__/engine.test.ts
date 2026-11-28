import { buildSequence, insertMoments, journeySequence, MOMENTS_ID, type SeqStep } from '@/sdk/flow/sequence';
import type { FlowAdapter } from '@/sdk/flow/adapter';
import { validateMoments } from '../validate';
import { momentUnits, slices } from '../units';
import { journeyMoments } from '../useJourneyMoments';
import type { Moment } from '../types';
import { SAFE_DEFAULT } from '@/sdk/content/validate';
import type { MomentsConfig } from '@/sdk/content/types';

const games = (n: number): SeqStep[] => Array.from({ length: n }, (_, i) => ({ gameId: `g${i % 3}`, localIndex: i }));
const momentPositions = (seq: SeqStep[]) => seq.flatMap((s, i) => (s.gameId === MOMENTS_ID ? [i + 1] : []));

const reviewed = { reviewedBy: 'Sheikh Test', reviewedOn: '2027-01-10', image: 1 };
const step = (n: number) => ({ image: n, phraseKey: `s${n}` });
const hadith: Moment = { ...reviewed, id: 'h1', type: 'hadith', textKey: 'h1', source: { book: 'Bukhari', number: '1', grade: 'sahih' } };
const dua: Moment = { ...reviewed, id: 'd1', type: 'dua', textKey: 'd1', textAr: 'دعاء', source: { book: 'Muslim', number: '2' } };
const ayah: Moment = {
  ...reviewed, id: 'a1', type: 'ayah', surah: 112, ayahs: [1, 4], textAr: 'قل', meaningKey: 'a1', audio: 2,
  recitation: { reciter: 'R', origin: 'O', permission: 'licence' },
};
const wudu: Moment = { ...reviewed, id: 'wudu', type: 'howto', topic: 'wudu', source: { book: 'Bukhari', number: '3' }, steps: [1, 2, 3, 4, 5, 6, 7, 8].map(step) };

describe('insertMoments', () => {
  // protects=moments land after every 4th game unit, at most twice; fails_when=positions differ from 5 and 10 or a third slips in; no_claim=none beyond protects
  it('places 2 moments at positions 5 and 10 of a 20-unit journey', () => {
    const out = insertMoments(games(20), { every: 4, max: 2, momentCount: 11 });
    expect(out).toHaveLength(22);
    expect(momentPositions(out)).toEqual([5, 10]);
    expect(out.filter((s) => s.gameId === MOMENTS_ID).map((s) => s.localIndex)).toEqual([0, 1]);
  });

  // protects=no moments means the journey is exactly the old one; fails_when=max 0 or no content changes the sequence; no_claim=none beyond protects
  it('returns the input unchanged with max 0 or no moments', () => {
    const seq = games(20);
    expect(insertMoments(seq, { every: 4, max: 0, momentCount: 5 })).toEqual(seq);
    expect(insertMoments(seq, { every: 4, max: 2, momentCount: 0 })).toEqual(seq);
  });

  // protects=a journey never ends on a moment; fails_when=a moment follows the last game unit; no_claim=none beyond protects
  it('never inserts after the final step', () => {
    expect(momentPositions(insertMoments(games(8), { every: 4, max: 5, momentCount: 5 }))).toEqual([5]);
  });

  // protects=there are never more moment slots than moments; fails_when=a slot points past the content; no_claim=none beyond protects
  it('caps at the number of moments', () => {
    expect(momentPositions(insertMoments(games(20), { every: 2, max: 5, momentCount: 1 }))).toEqual([3]);
  });
});

describe('journeySequence', () => {
  const stub = (gameId: string, count: number): FlowAdapter => ({ gameId, count, unitAt: (i) => ({ key: `${gameId}-${i}`, render: () => null }) });
  // protects=with moments off the journey equals buildSequence exactly; fails_when=any step differs; no_claim=none beyond protects
  it('equals buildSequence when moments are off', () => {
    const adapters = [stub('a', 5), stub('b', 5)];
    expect(journeySequence(adapters, null)).toEqual(buildSequence(adapters));
  });
});

describe('validateMoments', () => {
  // protects=sourced, reviewed moments pass; fails_when=a valid moment of any type is dropped; no_claim=none beyond protects
  it('keeps complete moments of every type', () => {
    expect(validateMoments([hadith, dua, ayah, wudu]).dropped).toEqual([]);
  });

  // protects=unreviewed or unsourced content never reaches a child; fails_when=a moment missing reviewer, date, source, permission or with a duplicate id survives; no_claim=does not judge content correctness
  it('drops and names incomplete moments', () => {
    const { moments, dropped } = validateMoments([
      { ...hadith, id: 'no-reviewer', reviewedBy: ' ' },
      { ...dua, id: 'no-date', reviewedOn: '' },
      { ...hadith, id: 'no-source', source: { book: '', number: '1', grade: 'sahih' } },
      { ...ayah, id: 'no-permission', recitation: { ...ayah.recitation, permission: '' } },
      { ...wudu, id: 'too-short', steps: [step(1), step(2)] },
      hadith,
      hadith,
    ] as Moment[]);
    expect(moments.map((m) => m.id)).toEqual(['h1']);
    expect(dropped).toEqual([
      'no-reviewer: missing reviewedBy',
      'no-date: missing reviewedOn',
      'no-source: missing source',
      'no-permission: missing recitation.permission',
      'too-short: needs at least 3 steps',
      'h1: duplicate id',
    ]);
  });
});

describe('momentUnits', () => {
  // protects=how-tos split into even 3–4 step units; fails_when=any unit has fewer than 3 or more than 4 steps (5 excepted); no_claim=none beyond protects
  it.each([
    [8, [4, 4]],
    [7, [4, 3]],
    [6, [3, 3]],
    [9, [3, 3, 3]],
    [4, [4]],
    [5, [5]],
  ])('splits %i steps into %j', (n, sizes) => {
    expect(slices(Array.from({ length: n }, (_, i) => i)).map((s) => s.length)).toEqual(sizes);
  });

  // protects=a later how-to unit shows the steps already done; fails_when=part 2 loses part 1's steps; no_claim=none beyond protects
  it('carries done steps into later how-to units', () => {
    const units = momentUnits([wudu], ['howto']);
    expect(units).toHaveLength(2);
    const second = units[1];
    expect(second.kind === 'howto' && second.before.length).toBe(4);
  });

  // protects=config `types` limits which moments appear; fails_when=a disallowed type yields units; no_claim=none beyond protects
  it('filters by allowed types', () => {
    expect(momentUnits([hadith, dua, ayah, wudu], ['dua']).map((u) => u.moment.id)).toEqual(['d1']);
  });
});

describe('journeyMoments', () => {
  const on: MomentsConfig = { ...SAFE_DEFAULT.moments, enabled: true, types: ['hadith', 'dua', 'ayah', 'howto'] };

  // protects=moments stay off unless config, the parent and content all allow them; fails_when=any one of the three being off still yields moments; no_claim=none beyond protects
  it('is null when config, parent switch or content says no', () => {
    expect(journeyMoments([hadith], { ...on, enabled: false }, true)).toBeNull();
    expect(journeyMoments([hadith], on, false)).toBeNull();
    expect(journeyMoments([], on, true)).toBeNull();
    expect(journeyMoments([hadith], { ...on, maxPerJourney: 0 }, true)).toBeNull();
  });

  // protects=the adapter covers every unit and rotates with the session seed; fails_when=count is wrong or the seed doesn't change which moment comes first; no_claim=does not render the units
  it('builds an adapter that rotates by seed', () => {
    const jm = journeyMoments([hadith, dua, ayah], on, true)!;
    expect(jm.adapter.count).toBe(3);
    expect(jm.adapter.unitAt(0, 0).key).toBe('moment:h1');
    expect(jm.adapter.unitAt(0, 1).key).toBe('moment:d1');
    expect(jm.adapter.unitAt(2, 1).key).toBe('moment:h1');
  });
});
