/**
 * School — the Egyptian KG curriculum as short "learn, then practise" lessons.
 *
 * Content is data: a Unit is a path of Lessons, a Lesson is a Learn card plus a
 * few practice Rounds. Arabic and English content is written in the subject's
 * own language (it is the subject matter, like the letters in Letter Land);
 * Math is built per app language. Every lesson carries a `bookRef` so our
 * content team can check it against the Ministry book page.
 */
import type { LanguageCode } from '@/sdk';

export type Curriculum = 'eg-moe';
export type Level = 'kg1' | 'kg2';
export type Term = 1 | 2;
export type Subject = 'arabic' | 'english' | 'math';

export const SUBJECTS: readonly Subject[] = ['arabic', 'english', 'math'];

/** What a tile in a round (or the round's "look at this" panel) shows. */
export type Visual =
  | { kind: 'text'; text: string }
  | { kind: 'emoji'; emoji: string; label?: string }
  | { kind: 'group'; emoji: string; n: number }
  | { kind: 'swatch'; color: string; label?: string };

/** One practice round: hear/read a prompt, tap the right tile. */
export type Round = {
  prompt: string;
  /** What the buddy says aloud (defaults to `prompt`). */
  say?: string;
  /** Optional panel above the tiles (the fish to count, the sound to match). */
  show?: Visual;
  options: Visual[];
  answer: number;
};

export type LearnWord = {
  emoji: string;
  text: string;
  /** Characters at the start of `text` to colour (the letter being learned). */
  mark?: number;
};

/** The "Learn" card: the buddy explains before any practice. */
export type Learn = {
  /** The big glyph: a letter, a numeral, a shape. */
  focus: Visual;
  /** Said when the focus card is tapped. */
  focusSay: string;
  /** Small label over the focus ("The letter M", "حرف الميم"). */
  caption: string;
  /** The buddy's explanation, spoken when the card opens. */
  explain: string;
  /** Letter forms / upper-lower case, shown as small chips. */
  forms?: string[];
  /** A row of things to count (number lessons). */
  group?: { emoji: string; n: number };
  words: LearnWord[];
};

/** "I learned" checklist lines on the certificate. */
export type Check = 'say' | 'find' | 'pictures' | 'count' | 'words' | 'order';

export type Lesson = {
  id: string;
  title: string;
  /** Short glyph for the path stop (the letter, numeral, shape). */
  stop: string;
  /** The explain step; review stops go straight to practice. */
  learn?: Learn;
  rounds: Round[];
  checks: Check[];
  /** Where in the MOE book this comes from, for the content review. */
  bookRef: string;
};

export type Unit = {
  id: string;
  curriculum: Curriculum;
  subject: Subject;
  level: Level;
  term: Term;
  /** 1-based position in the subject's term. */
  number: number;
  title: string;
  /** Language the lessons are written and spoken in. */
  lang: LanguageCode;
  /** The "Listen" stop that opens the unit. */
  intro: { emojis: string[]; text: string };
  lessons: Lesson[];
};

/** Stars a unit's treasure chest adds when it opens. */
export const CHEST_STARS = 3;
