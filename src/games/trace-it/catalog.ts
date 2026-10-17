import {
  ARABIC_LETTERS,
  LATIN_LETTERS,
  SCHOOL_ORDER,
  schoolOrdered,
} from '@/games/_shared/letters';
import { currentLanguage, type LanguageCode } from '@/sdk';
import { ARABIC_GLYPHS } from './glyphs/arabic';
import { DIGITS } from './glyphs/digits';
import { LATIN_LOWER, LATIN_UPPER } from './glyphs/latin';
import { WARMUPS, warmupFor } from './glyphs/warmup';
import type { Glyph, Track } from './types';

export type Script = 'latin' | 'arabic';

export type TraceChar = {
  id: string;
  track: Track;
  /** Letters only: the script, which sets the language they are spoken and shown in. */
  script?: Script;
  label: string;
  glyphs: readonly Glyph[];
  emoji?: string;
  word?: string;
  nameKey: string;
  count?: number;
  from?: string;
  to?: string;
  faces?: 'left';
};

export type RoundStep = { glyph: Glyph; pass: 'guided' | 'solo' };

/**
 * The app language's script: the letters the picker opens on, the flow's letters
 * and the warm-up direction — not I18nManager.isRTL, which can lag the language switch.
 */
export function currentScript(): Script {
  return currentLanguage() === 'ar' ? 'arabic' : 'latin';
}

/** The language a character is named in: its script's for letters, else the app's. */
export function charLanguage(c: TraceChar): LanguageCode {
  if (!c.script) return currentLanguage();
  return c.script === 'arabic' ? 'ar' : 'en';
}

/**
 * Picker tabs. Both scripts' letters are always offered — a KG child studies
 * Arabic and English side by side — with the app language's first.
 */
export type TabId = 'warmup' | Script | 'numbers';

export function tabsFor(script: Script): TabId[] {
  return ['warmup', script, script === 'arabic' ? 'latin' : 'arabic', 'numbers'];
}

export function charsForTab(tab: TabId, script: Script): TraceChar[] {
  if (tab === 'warmup' || tab === 'numbers') return charsFor(tab === 'warmup' ? 'warmup' : 'numbers', script);
  return charsFor('letters', tab);
}

const DIGIT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

function byId(set: readonly Glyph[]): Map<string, Glyph> {
  return new Map(set.map((g) => [g.id, g]));
}

function need(map: Map<string, Glyph>, id: string): Glyph {
  const g = map.get(id);
  if (!g) throw new Error(`missing glyph: ${id}`);
  return g;
}

export function charsFor(track: Track, script: Script): TraceChar[] {
  if (track === 'warmup') {
    return WARMUPS.map((w) => {
      return {
        id: `w:${w.id}`,
        track,
        label: w.from,
        glyphs: [warmupFor(w.id, script === 'arabic')],
        nameKey: `trace-it:warmup.${w.id}`,
        from: w.from,
        to: w.to,
        faces: w.faces,
      };
    });
  }
  if (track === 'numbers') {
    const glyphs = byId(DIGITS);
    return DIGIT_ORDER.map((n) => ({
      id: `d${n}`,
      track,
      label: String(n),
      glyphs: [need(glyphs, `d${n}`)],
      emoji: '🎈',
      nameKey: `trace-it:digits.d${n}`,
      count: n,
    }));
  }
  if (script === 'arabic') {
    const glyphs = byId(ARABIC_GLYPHS);
    return schoolOrdered(ARABIC_LETTERS, SCHOOL_ORDER.arabic).map((l) => ({
      id: l.id,
      track,
      script,
      label: l.glyph ?? l.id,
      glyphs: [need(glyphs, l.id)],
      emoji: l.emoji,
      word: l.word,
      nameKey: `letters:names.${l.id}`,
    }));
  }
  const upper = byId(LATIN_UPPER);
  const lower = byId(LATIN_LOWER);
  return schoolOrdered(LATIN_LETTERS, SCHOOL_ORDER.latin).map((l) => ({
    id: l.id,
    track,
    script,
    label: l.glyph ?? l.id,
    glyphs: [need(upper, l.id), need(lower, l.id.toLowerCase())],
    emoji: l.emoji,
    word: l.word,
    nameKey: `letters:names.${l.id}`,
  }));
}

export function roundSteps(c: TraceChar, mode: 'full' | 'guidedOnly'): RoundStep[] {
  const guided = c.glyphs.map((glyph): RoundStep => ({ glyph, pass: 'guided' }));
  if (mode === 'guidedOnly' || c.track === 'warmup') return guided;
  return [...guided, ...c.glyphs.map((glyph): RoundStep => ({ glyph, pass: 'solo' }))];
}

export function nextSuggested(
  chars: readonly TraceChar[],
  done: Readonly<Record<string, number>>,
): string | undefined {
  return chars.find((c) => !done[c.id])?.id;
}

/**
 * The letter for flow unit `nth`. Each unit records its stars before the next
 * mounts, so the first untraced letter is always the next new one; once all
 * are traced, the school-order head stands in.
 */
export function flowLetter(
  chars: readonly TraceChar[],
  done: Readonly<Record<string, number>>,
  nth: 0 | 1,
): TraceChar {
  return chars.find((c) => !done[c.id]) ?? chars[nth];
}

/** True once every character of `track`'s block has stars: the taught school-order letters, or the whole digit / warm-up set. */
export function blockComplete(
  track: Track,
  script: Script,
  done: Readonly<Record<string, number>>,
): boolean {
  const ids = track === 'letters' ? SCHOOL_ORDER[script] : charsFor(track, script).map((c) => c.id);
  return ids.every((id) => !!done[id]);
}
