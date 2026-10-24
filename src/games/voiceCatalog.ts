import type { LanguageCode } from '@/sdk';
import { ARABIC_LETTERS, LATIN_LETTERS } from './_shared/letters';
import { letterPhrase } from './_shared/letters/phrase';
import { ANIMALS } from './animal-safari/constants';
import { animalPhrase } from './animal-safari/phrase';
import { CHALLENGES } from './color-mixer/constants';
import { colorTargetPhrase } from './color-mixer/phrase';
import { NUMBERS } from './numbers-land/constants';
import { numberPhrase } from './numbers-land/phrase';
import { charsFor } from './trace-it/catalog';
import { charPhrase } from './trace-it/phrase';

export type VoiceLine = { lang: LanguageCode; text: string };

const LANGS: readonly LanguageCode[] = ['en', 'ar'];

/**
 * Every phrase the games speak, built by the same phrase builders the games use,
 * so a bundled clip exists for exactly what is said. Deduped and sorted.
 */
export function voiceCatalog(): VoiceLine[] {
  const lines: VoiceLine[] = [
    // Letters are spoken in their own script's language (letter-land, trace-it).
    ...LATIN_LETTERS.map((l) => ({ lang: 'en' as const, text: letterPhrase(l, 'en') })),
    ...ARABIC_LETTERS.map((l) => ({ lang: 'ar' as const, text: letterPhrase(l, 'ar') })),
  ];
  for (const lang of LANGS) {
    for (const n of NUMBERS) lines.push({ lang, text: numberPhrase(n.id, lang) });
    for (const a of ANIMALS) lines.push({ lang, text: animalPhrase(a.id, lang) });
    for (const c of CHALLENGES) lines.push({ lang, text: colorTargetPhrase(c.targetColor, lang) });
    for (const c of [...charsFor('warmup', 'latin'), ...charsFor('numbers', 'latin')]) lines.push(charPhrase(c, lang));
  }
  const seen = new Map(lines.map((l) => [`${l.lang}:${l.text}`, l]));
  return [...seen.values()].sort((a, b) => a.lang.localeCompare(b.lang) || a.text.localeCompare(b.text));
}
