import { getEmojiImage } from '@/sdk/assets/emoji/images';
import { allUnits, findLesson, shuffleRound, unitsFor, type Visual } from '..';
import { SUBJECTS } from '../types';

const LANGS = ['en', 'ar'] as const;

const key = (v: Visual) => (v.kind === 'text' ? v.text : v.kind === 'emoji' ? v.emoji : v.kind === 'swatch' ? v.color : `${v.emoji}x${v.n}`);

describe.each(LANGS)('School content (app language %s)', (lang) => {
  const units = allUnits(lang);

  it('has Term 1 units for every subject and both KG levels', () => {
    for (const subject of SUBJECTS) {
      for (const level of ['kg1', 'kg2'] as const) {
        expect(unitsFor(lang, subject, level, 1).length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps lesson ids unique', () => {
    const ids = units.flatMap((u) => u.lessons.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every round a valid answer among distinct tiles', () => {
    for (const u of units) {
      for (const l of u.lessons) {
        expect(l.rounds.length).toBeGreaterThanOrEqual(2);
        for (const r of l.rounds) {
          expect(r.prompt).not.toMatch(/school\.|{{/);
          expect(r.options.length).toBeGreaterThanOrEqual(2);
          expect(r.answer).toBeGreaterThanOrEqual(0);
          expect(r.answer).toBeLessThan(r.options.length);
          expect(new Set(r.options.map(key)).size).toBe(r.options.length);
        }
      }
    }
  });

  it('resolves every Learn string (no raw keys)', () => {
    for (const u of units) {
      expect(u.title).not.toMatch(/school\./);
      expect(u.intro.text).not.toMatch(/school\./);
      for (const l of u.lessons) {
        if (!l.learn) continue;
        for (const s of [l.learn.caption, l.learn.explain, l.learn.focusSay]) expect(s).not.toMatch(/school\.|{{/);
      }
    }
  });

  it('has bundled art for every picture', () => {
    const missing = new Set<string>();
    const check = (v?: Visual) => {
      if (v && (v.kind === 'emoji' || v.kind === 'group') && !getEmojiImage(v.emoji)) missing.add(v.emoji);
    };
    for (const u of units) {
      u.intro.emojis.forEach((e) => !getEmojiImage(e) && missing.add(e));
      for (const l of u.lessons) {
        l.learn?.words.forEach((w) => !getEmojiImage(w.emoji) && missing.add(w.emoji));
        check(l.learn?.focus);
        l.rounds.forEach((r) => {
          check(r.show);
          r.options.forEach(check);
        });
      }
    }
    expect([...missing]).toEqual([]);
  });
});

it('Arabic lessons ask in Arabic and English lessons in English, whatever the app language', () => {
  const ar = findLesson('en', 'ar-kg1-u2-meem')!.lesson;
  expect(ar.rounds[0].prompt).toBe('أين حرف الميم؟');
  const en = findLesson('ar', 'en-kg1-u2-s')!.lesson;
  expect(en.rounds[0].prompt).toBe('Find the letter S');
});

it('follows the KG1 Arabic book order for unit 2 (أ ب م ح ج د)', () => {
  const u = allUnits('en').find((x) => x.id === 'ar-kg1-u2')!;
  expect(u.lessons.map((l) => l.stop)).toEqual(['أ', 'ب', 'م', 'ح', 'ج', 'د', '✓']);
});

it('shuffles tiles but keeps the right answer', () => {
  const r = findLesson('en', 'math-kg1-n3')!.lesson.rounds[0];
  for (let i = 0; i < 20; i++) {
    const s = shuffleRound(r);
    expect(key(s.options[s.answer])).toBe(key(r.options[r.answer]));
  }
});
