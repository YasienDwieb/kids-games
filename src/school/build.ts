/**
 * Lesson builders: one short description per lesson (a letter and its words, a
 * number, a shape) becomes a Learn card plus practice rounds. Content files stay
 * a readable list a teacher can review; the round mechanics live here.
 *
 * Prompts come from the core catalogue (`school.prompt.*`) in the LESSON's
 * language — an Arabic lesson asks in Arabic even when the app runs in English.
 * Option order is shuffled again when a lesson is played (see shuffleRound).
 */
import { i18n, type LanguageCode } from '@/sdk';
import { ACCENTS, POP } from '@/constants/colors';
import type { Check, Learn, LearnWord, Lesson, Round, Visual } from './types';

export type Tr = (key: string, opts?: Record<string, unknown>) => string;

/** Translator for `core:school.<key>` in a fixed language. */
export function trFor(lng: LanguageCode): Tr {
  return (key, opts) => String(i18n.t(`core:school.${key}`, { lng, ...opts }));
}

// --- seeded randomness, so a lesson's distractors are stable per lesson id ---

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: string): () => number {
  let a = hash(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(from: readonly T[], n: number, rand: () => number, not: readonly T[] = []): T[] {
  const pool = from.filter((x) => !not.includes(x));
  const out: T[] = [];
  while (out.length < n && pool.length > 0) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

/** A round with the right answer first and `others` after; shuffled at play time. */
function round(prompt: string, right: Visual, others: Visual[], extra: Partial<Round> = {}): Round {
  return { prompt, options: [right, ...others], answer: 0, ...extra };
}

/** Same round with its tiles in a fresh order (called each time a lesson starts). */
export function shuffleRound(r: Round, rand: () => number = Math.random): Round {
  const order = r.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...r, options: order.map((i) => r.options[i]), answer: order.indexOf(r.answer) };
}

const text = (t: string): Visual => ({ kind: 'text', text: t });
const emoji = (e: string): Visual => ({ kind: 'emoji', emoji: e });

// --- Arabic letters ---------------------------------------------------------

const AR_POOL = ['أ', 'ب', 'ت', 'ج', 'ح', 'خ', 'د', 'ر', 'س', 'ع', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ي'];
/** Letters that never join the next one: only isolated + final forms. */
const AR_NON_JOINING = 'اأإآدذرزو';

export type ArLetterSpec = {
  id: string;
  title: string;
  letter: string;
  /** The letter's name as said in "حرف الميم". */
  name: string;
  /** Three [emoji, word] pairs whose word starts with the letter. */
  words: [string, string][];
  bookRef: string;
};

function arForms(l: string): string[] {
  return AR_NON_JOINING.includes(l) ? [l, `ـ${l}`] : [`${l}ـ`, `ـ${l}ـ`, `ـ${l}`];
}

function arVowels(l: string): string[] {
  return l === 'أ' ? ['أَ', 'أُ', 'إِ'] : [`${l}َ`, `${l}ُ`, `${l}ِ`];
}

/**
 * KG1: find the letter, find its pictures. KG2 adds a short-vowel round
 * (hear بُ, pick it from بَ بُ بِ), as the KG2 book revisits each letter with
 * its harakat.
 */
export function arabicLetter(spec: ArLetterSpec, pictures: readonly string[], kg2: boolean): Lesson {
  const tr = trFor('ar');
  const rand = rng(spec.id);
  const [first] = spec.words;
  const sound = arVowels(spec.letter)[0];
  const others = (n: number) => pick(AR_POOL, n, rand, [spec.letter]).map(text);
  const notMine = pictures.filter((e) => !spec.words.some(([w]) => w === e));
  const pics = (n: number) => pick(notMine, n, rand).map(emoji);
  const findLetter = tr('prompt.findLetter', { x: spec.name });
  const startsWith = tr('prompt.startsWith', { x: spec.name });

  const rounds: Round[] = [
    round(findLetter, text(spec.letter), others(2)),
    round(startsWith, emoji(spec.words[0][0]), pics(2)),
    round(findLetter, text(spec.letter), others(3)),
    round(startsWith, emoji(spec.words[1][0]), pics(2)),
  ];
  if (kg2) {
    const vowels = arVowels(spec.letter);
    const heard = vowels[Math.floor(rand() * vowels.length)];
    rounds.push(
      round(
        tr('prompt.hearSound'),
        text(heard),
        vowels.filter((v) => v !== heard).map(text),
        { say: `${tr('prompt.hearSound')} ${heard}`, show: { kind: 'emoji', emoji: '👂' } },
      ),
    );
  }

  const learn: Learn = {
    focus: text(spec.letter),
    focusSay: sound,
    caption: tr('learn.arCaption', { name: spec.name }),
    explain: tr('learn.arLetter', { name: spec.name, sound, word: first[1] }),
    forms: arForms(spec.letter),
    words: spec.words.map(([e, w]) => ({ emoji: e, text: w, mark: 1 })),
  };
  return {
    id: spec.id,
    title: spec.title,
    stop: spec.letter,
    learn,
    rounds,
    checks: ['say', 'find', 'pictures'],
    bookRef: spec.bookRef,
  };
}

// --- English letters and words ---------------------------------------------

const EN_POOL = 'ABCDEFGHIJKLMNOPRSTUW'.split('');

export type EnLetterSpec = {
  id: string;
  letter: string;
  words: [string, string][];
  bookRef: string;
};

export function englishLetter(spec: EnLetterSpec, pictures: readonly string[]): Lesson {
  const tr = trFor('en');
  const rand = rng(spec.id);
  const up = spec.letter.toUpperCase();
  const low = spec.letter.toLowerCase();
  const others = pick(EN_POOL, 3, rand, [up]);
  const notMine = pictures.filter((e) => !spec.words.some(([w]) => w === e));
  const pics = (n: number) => pick(notMine, n, rand).map(emoji);
  const startsWith = tr('prompt.startsWith', { x: up });
  return {
    id: spec.id,
    title: tr('learn.enCaption', { x: up }),
    stop: `${up}${low}`,
    learn: {
      focus: text(`${up}${low}`),
      focusSay: low,
      caption: tr('learn.enCaption', { x: up }),
      explain: tr('learn.enLetter', { x: up, word: spec.words[0][1] }),
      forms: [up, low],
      words: spec.words.map(([e, w]) => ({ emoji: e, text: w, mark: 1 })),
    },
    rounds: [
      round(tr('prompt.findLetter', { x: up }), text(up), others.slice(0, 2).map(text)),
      round(startsWith, emoji(spec.words[0][0]), pics(2)),
      round(tr('prompt.findSmall', { x: low }), text(low), others.slice(1, 3).map((o) => text(o.toLowerCase()))),
      round(startsWith, emoji(spec.words[1][0]), pics(2)),
    ],
    checks: ['say', 'find', 'pictures'],
    bookRef: spec.bookRef,
  };
}

export type VocabSpec = {
  id: string;
  title: string;
  /** Four to eight [emoji, word] pairs from the unit's vocabulary list. */
  words: [string, string][];
  bookRef: string;
  lang?: LanguageCode;
};

/** "Find the chair": learn the unit's words, then pick each from three pictures. */
export function vocab(spec: VocabSpec): Lesson {
  const lang = spec.lang ?? 'en';
  const tr = trFor(lang);
  const rand = rng(spec.id);
  const chosen = pick(spec.words, Math.min(4, spec.words.length), rand);
  const rounds = chosen.map(([e, w]) =>
    round(
      tr('prompt.findWord', { x: w }),
      emoji(e),
      pick(spec.words, 2, rand, spec.words.filter(([x]) => x === e)).map(([o]) => emoji(o)),
    ),
  );
  return {
    id: spec.id,
    title: spec.title,
    stop: spec.words[0][0],
    learn: {
      focus: emoji(spec.words[0][0]),
      focusSay: spec.words[0][1],
      caption: spec.title,
      explain: tr('learn.vocab'),
      words: spec.words.slice(0, 6).map(([e, w]) => ({ emoji: e, text: w })),
    },
    rounds,
    checks: ['words', 'find'],
    bookRef: spec.bookRef,
  };
}

// --- Math: numbers, shapes, colours, days ----------------------------------

const COUNT_EMOJI = ['🍎', '🐟', '⭐', '🎈', '🐥', '🍓', '🚗', '🌸', '⚽', '🐞'];

export function number(n: number, lang: LanguageCode, max: number, bookRef: string, idPrefix: string): Lesson {
  const tr = trFor(lang);
  const id = `${idPrefix}-n${n}`;
  const rand = rng(id);
  const [a, b] = pick(COUNT_EMOJI, 2, rand);
  const lo = Math.max(1, max - 9);
  const near = (k: number) =>
    pick(
      Array.from({ length: max - lo + 1 }, (_, i) => lo + i),
      k,
      rand,
      [n],
    );
  const numerals = (xs: number[]) => xs.map((x) => text(String(x)));
  const count = Array.from({ length: n }, (_, i) => tr(`words.number.${i + 1}`)).join(lang === 'ar' ? '، ' : ', ');
  return {
    id,
    title: tr('learn.numberCaption', { n }),
    stop: String(n),
    learn: {
      focus: text(String(n)),
      focusSay: tr(`words.number.${n}`),
      caption: tr('learn.numberCaption', { n }),
      explain: tr('learn.number', { word: tr(`words.number.${n}`), count }),
      group: { emoji: a, n },
      words: [],
    },
    rounds: [
      round(tr('prompt.howMany'), text(String(n)), numerals(near(2)), { show: { kind: 'group', emoji: a, n } }),
      round(tr('prompt.findNumber', { x: tr(`words.number.${n}`) }), text(String(n)), numerals(near(2))),
      round(
        tr('prompt.whichGroup', { x: tr(`words.number.${n}`) }),
        { kind: 'group', emoji: b, n },
        near(2).map((k) => ({ kind: 'group', emoji: b, n: k }) as Visual),
      ),
      round(tr('prompt.howMany'), text(String(n)), numerals(near(3)), { show: { kind: 'group', emoji: b, n } }),
    ],
    checks: ['say', 'count', 'find'],
    bookRef,
  };
}

export const SHAPES = {
  circle: ['🔴', '🔵', '🟢'],
  square: ['🟥', '🟦', '🟩'],
  star: ['⭐', '🌟', '⭐'],
  heart: ['❤️', '💙', '💚'],
  triangle: ['🔺', '🔻', '🔺'],
} as const;
export type ShapeId = keyof typeof SHAPES;

export function shape(id: ShapeId, lang: LanguageCode, bookRef: string, idPrefix: string): Lesson {
  const tr = trFor(lang);
  const lessonId = `${idPrefix}-${id}`;
  const rand = rng(lessonId);
  const name = tr(`words.shape.${id}`);
  const all = Object.keys(SHAPES) as ShapeId[];
  const others = (k: number, i: number) => pick(all, k, rand, [id]).map((o) => emoji(SHAPES[o][i % 3]));
  return {
    id: lessonId,
    title: name,
    stop: SHAPES[id][0],
    learn: {
      focus: emoji(SHAPES[id][0]),
      focusSay: name,
      caption: name,
      explain: tr('learn.shape', { x: name }),
      words: SHAPES[id].map((e) => ({ emoji: e, text: name })),
    },
    rounds: [0, 1, 2, 0].map((i, k) =>
      round(tr('prompt.findShape', { x: name }), emoji(SHAPES[id][i]), others(k === 3 ? 3 : 2, i + 1)),
    ),
    checks: ['say', 'find'],
    bookRef,
  };
}

export const COLOURS = {
  red: { swatch: ACCENTS.coral.base, things: ['🍎', '🍓', '🚒'] },
  blue: { swatch: ACCENTS.blue.base, things: ['🐳', '💧', '🫐'] },
  yellow: { swatch: POP.zap, things: ['🍌', '🐥', '🌞'] },
  green: { swatch: ACCENTS.green.base, things: ['🐸', '🥒', '🌳'] },
  orange: { swatch: ACCENTS.orange.base, things: ['🍊', '🥕', '🎃'] },
} as const;
export type ColourId = keyof typeof COLOURS;

export function colour(id: ColourId, lang: LanguageCode, bookRef: string, idPrefix: string): Lesson {
  const tr = trFor(lang);
  const lessonId = `${idPrefix}-${id}`;
  const rand = rng(lessonId);
  const name = tr(`words.colour.${id}`);
  const all = Object.keys(COLOURS) as ColourId[];
  const swatch = (c: ColourId): Visual => ({ kind: 'swatch', color: COLOURS[c].swatch });
  const otherThings = (k: number, i: number) => pick(all, k, rand, [id]).map((o) => emoji(COLOURS[o].things[i]));
  return {
    id: lessonId,
    title: name,
    stop: '🎨',
    learn: {
      focus: swatch(id),
      focusSay: name,
      caption: name,
      explain: tr('learn.colour', { x: name }),
      words: COLOURS[id].things.map((e) => ({ emoji: e, text: name })),
    },
    rounds: [
      round(tr('prompt.findColour', { x: name }), swatch(id), pick(all, 2, rand, [id]).map(swatch)),
      round(tr('prompt.whichColour', { x: name }), emoji(COLOURS[id].things[0]), otherThings(2, 0)),
      round(tr('prompt.findColour', { x: name }), swatch(id), pick(all, 3, rand, [id]).map(swatch)),
      round(tr('prompt.whichColour', { x: name }), emoji(COLOURS[id].things[1]), otherThings(2, 1)),
    ],
    checks: ['say', 'find'],
    bookRef,
  };
}

/** A readiness lesson over several colours (Arabic unit 1, التهيئة). */
export function colourSet(ids: ColourId[], lang: LanguageCode, title: string, bookRef: string, id: string): Lesson {
  const tr = trFor(lang);
  const rand = rng(id);
  const all = Object.keys(COLOURS) as ColourId[];
  const swatch = (c: ColourId): Visual => ({ kind: 'swatch', color: COLOURS[c].swatch });
  return {
    id,
    title,
    stop: '🎨',
    learn: {
      focus: swatch(ids[0]),
      focusSay: tr(`words.colour.${ids[0]}`),
      caption: title,
      explain: tr('learn.colours'),
      words: ids.map((c) => ({ emoji: COLOURS[c].things[0], text: tr(`words.colour.${c}`) })),
    },
    rounds: ids.map((c) =>
      round(tr('prompt.findColour', { x: tr(`words.colour.${c}`) }), swatch(c), pick(all, 2, rand, [c]).map(swatch)),
    ),
    checks: ['say', 'find'],
    bookRef,
  };
}

/** A readiness lesson over several shapes. */
export function shapeSet(ids: ShapeId[], lang: LanguageCode, title: string, bookRef: string, id: string): Lesson {
  const tr = trFor(lang);
  const rand = rng(id);
  const all = Object.keys(SHAPES) as ShapeId[];
  return {
    id,
    title,
    stop: '🔺',
    learn: {
      focus: emoji(SHAPES[ids[0]][0]),
      focusSay: tr(`words.shape.${ids[0]}`),
      caption: title,
      explain: tr('learn.shapes'),
      words: ids.map((s) => ({ emoji: SHAPES[s][0], text: tr(`words.shape.${s}`) })),
    },
    rounds: ids.map((s) =>
      round(
        tr('prompt.findShape', { x: tr(`words.shape.${s}`) }),
        emoji(SHAPES[s][1]),
        pick(all, 2, rand, [s]).map((o) => emoji(SHAPES[o][1])),
      ),
    ),
    checks: ['say', 'find'],
    bookRef,
  };
}

/** Days of the week: "What day comes after Monday?" */
export function days(lang: LanguageCode, title: string, bookRef: string, id: string): Lesson {
  const tr = trFor(lang);
  const rand = rng(id);
  // The KG2 book's week starts on Sunday.
  const week = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const name = (d: string) => tr(`words.day.${d}`);
  const starts = pick([0, 1, 2, 3, 4, 5], 4, rand);
  return {
    id,
    title,
    stop: '📅',
    learn: {
      focus: text('7'),
      focusSay: week.map(name).join(lang === 'ar' ? '، ' : ', '),
      caption: title,
      explain: tr('learn.days'),
      words: week.map((d) => ({ emoji: '📅', text: name(d) })),
    },
    rounds: starts.map((i) =>
      round(
        tr('prompt.dayAfter', { x: name(week[i]) }),
        text(name(week[i + 1])),
        pick(week, 2, rand, [week[i + 1], week[i]]).map((d) => text(name(d))),
        { show: { kind: 'text', text: name(week[i]) } },
      ),
    ),
    checks: ['order'],
    bookRef,
  };
}

/** The unit's review stop: one round from each lesson, no Learn step. */
export function review(lessons: Lesson[], lang: LanguageCode, id: string): Lesson {
  const tr = trFor(lang);
  const rand = rng(id);
  const rounds = lessons
    .filter((l) => l.rounds.length > 0)
    .slice(0, 6)
    .map((l) => l.rounds[Math.floor(rand() * l.rounds.length)]);
  return { id, title: tr('stop.review'), stop: '✓', rounds, checks: ['find'], bookRef: 'review' };
}

/** Every emoji a set of lessons draws (pictures for distractors, asset checks). */
export function emojisOf(words: [string, string][][]): string[] {
  return [...new Set(words.flat().map(([e]) => e))];
}

export type { Check, LearnWord };
