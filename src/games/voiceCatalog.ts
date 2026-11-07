import { ACCENTS, getAllGames, type LanguageCode } from '@/sdk';
import { ARABIC_LETTERS, LATIN_LETTERS } from './_shared/letters';
import { letterPhrase } from './_shared/letters/phrase';
import { ANIMALS } from './animal-safari/constants';
import { animalPhrase } from './animal-safari/phrase';
import { popPhrase as archerPhrase } from './balloon-archer/phrase';
import { catchPhrase } from './candy-catch/phrase';
import { COLORS as MIX_COLORS } from './color-mixer/constants';
import { CHALLENGES } from './color-mixer/constants';
import { colorNamePhrase, colorTargetPhrase, dragHintPhrase, paintPhrase } from './color-mixer/phrase';
import type { ColorId } from './color-mixer/types';
import { MAX_OBJECTS } from './count-and-pop/constants';
import { makePhrase, popPhrase, questionPhrase } from './count-and-pop/phrase';
import { THEMES } from './match-up/content';
import { matchPhrase } from './match-up/phrase';
import { mazePhrase } from './mouse-maze/phrase';
import { NUMBERS } from './numbers-land/constants';
import { numberPhrase } from './numbers-land/phrase';
import { puzzlePhrase } from './shape-detective/phrase';
import { pairsPhrase } from './simple-pairs/phrase';
import { charsFor } from './trace-it/catalog';
import { drivePhrase } from './turbo-road/phrase';
import { charPhrase } from './trace-it/phrase';

/** Where a phrase is heard: a game id and a short label for the Voice Studio. */
export type VoiceUse = { game: string; where: string };
export type VoiceLine = { lang: LanguageCode; text: string; uses: VoiceUse[] };
export type VoiceGame = { id: string; name: string; icon: string; accent: { base: string; deep: string; tint: string } };

const LANGS: readonly LanguageCode[] = ['en', 'ar'];

/**
 * Every phrase the games speak, built by the same phrase builders the games use,
 * so a bundled clip exists for exactly what is said. Deduped (uses merged) and sorted.
 */
export function voiceCatalog(): VoiceLine[] {
  const lines = new Map<string, VoiceLine>();
  const add = (lang: LanguageCode, text: string, use: VoiceUse) => {
    const key = `${lang}:${text}`;
    const line = lines.get(key) ?? { lang, text, uses: [] };
    if (!line.uses.some((u) => u.game === use.game && u.where === use.where)) line.uses.push(use);
    lines.set(key, line);
  };

  // Letters are spoken in their own script's language (letter-land, trace-it).
  LATIN_LETTERS.forEach((l) => add('en', letterPhrase(l, 'en'), { game: 'letter-land', where: 'Listen & find' }));
  ARABIC_LETTERS.forEach((l) => add('ar', letterPhrase(l, 'ar'), { game: 'letter-land', where: 'Listen & find' }));
  for (const [script, where] of [['latin', 'ABC tab'], ['arabic', 'أ ب ت tab']] as const) {
    charsFor('letters', script).forEach((c) => {
      const p = charPhrase(c);
      add(p.lang, p.text, { game: 'trace-it', where });
    });
  }
  for (const lang of LANGS) {
    NUMBERS.forEach((n) => add(lang, numberPhrase(n.id, lang), { game: 'numbers-land', where: 'Listen & find' }));
    ANIMALS.forEach((a) => add(lang, animalPhrase(a.id, lang), { game: 'animal-safari', where: 'Hear the name' }));
    CHALLENGES.forEach((c) => add(lang, colorTargetPhrase(c.targetColor, lang), { game: 'color-mixer', where: 'Journey goal' }));
    (Object.keys(MIX_COLORS) as ColorId[]).forEach((id) =>
      add(lang, colorNamePhrase(id, lang), { game: 'color-mixer', where: 'Pot colour name' }),
    );
    add(lang, dragHintPhrase(lang), { game: 'color-mixer', where: 'Empty pot hint' });
    add(lang, paintPhrase(lang), { game: 'color-mixer', where: 'Mystery colour' });
    for (let n = 1; n <= MAX_OBJECTS; n += 1) {
      add(lang, popPhrase(n, lang), { game: 'count-and-pop', where: 'Pop this many' });
      add(lang, makePhrase(n, lang), { game: 'count-and-pop', where: 'How many more' });
    }
    (['howMany', 'addition'] as const).forEach((m) => add(lang, questionPhrase(m, lang), { game: 'count-and-pop', where: 'Question' }));
    (['pattern', 'oddOneOut', 'sort'] as const).forEach((p) => add(lang, puzzlePhrase(p, lang), { game: 'shape-detective', where: 'Instruction' }));
    THEMES.forEach((th) => add(lang, matchPhrase(th.promptKey, lang), { game: 'match-up', where: 'Round prompt' }));
    add(lang, catchPhrase(lang), { game: 'candy-catch', where: 'Start' });
    add(lang, pairsPhrase(lang), { game: 'simple-pairs', where: 'Board' });
    add(lang, mazePhrase(lang), { game: 'mouse-maze', where: 'Maze' });
    add(lang, archerPhrase(lang), { game: 'balloon-archer', where: 'Level start' });
    add(lang, drivePhrase(lang), { game: 'turbo-road', where: 'Drive start' });
    for (const [track, where] of [['warmup', 'Warm-up'], ['numbers', 'Numbers tab']] as const) {
      charsFor(track, 'latin').forEach((c) => {
        const p = charPhrase(c, lang);
        add(p.lang, p.text, { game: 'trace-it', where });
      });
    }
  }
  return [...lines.values()].sort((a, b) => a.lang.localeCompare(b.lang) || a.text.localeCompare(b.text));
}

/** The games that speak, in home order, with what the Voice Studio needs to label them. */
export function voiceGames(): VoiceGame[] {
  const speaking = new Set(voiceCatalog().flatMap((l) => l.uses.map((u) => u.game)));
  return getAllGames()
    .filter((g) => speaking.has(g.id))
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon, accent: { ...ACCENTS[g.accent ?? 'blue'] } }));
}
