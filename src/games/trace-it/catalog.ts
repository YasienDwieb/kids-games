import {
  ARABIC_LETTERS,
  LATIN_LETTERS,
  SCHOOL_ORDER,
  schoolOrdered,
} from '@/games/_shared/letters';
import { ARABIC_GLYPHS } from './glyphs/arabic';
import { DIGITS } from './glyphs/digits';
import { LATIN_LOWER, LATIN_UPPER } from './glyphs/latin';
import { WARMUPS, warmupFor } from './glyphs/warmup';
import type { Glyph, Track } from './types';

export type TraceChar = {
  id: string;
  track: Track;
  label: string;
  glyphs: readonly Glyph[];
  emoji?: string;
  word?: string;
  nameKey: string;
  count?: number;
  from?: string;
  to?: string;
  fromSide?: 'left' | 'right';
};

export type RoundStep = { glyph: Glyph; pass: 'guided' | 'solo' };

const DIGIT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

function byId(set: readonly Glyph[]): Map<string, Glyph> {
  return new Map(set.map((g) => [g.id, g]));
}

function need(map: Map<string, Glyph>, id: string): Glyph {
  const g = map.get(id);
  if (!g) throw new Error(`missing glyph: ${id}`);
  return g;
}

export function charsFor(track: Track, script: 'latin' | 'arabic'): TraceChar[] {
  if (track === 'warmup') {
    return WARMUPS.map((w) => {
      const { glyph, fromSide } = warmupFor(w.id, script === 'arabic');
      return {
        id: `w:${w.id}`,
        track,
        label: w.from,
        glyphs: [glyph],
        nameKey: `trace-it:warmup.${w.id}`,
        from: w.from,
        to: w.to,
        fromSide,
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
