import { currentLanguage, i18n, type LanguageCode } from '@/sdk';
import { letterPhrase } from '@/games/_shared/letters/phrase';
import { charLanguage, type TraceChar } from './catalog';

/**
 * What a character says: letters in their own script's language as «<name>. <Word>»,
 * warm-ups and digits by name in `appLang`.
 */
export function charPhrase(char: TraceChar, appLang: LanguageCode = currentLanguage()): { text: string; lang: LanguageCode } {
  const lang = char.script ? charLanguage(char) : appLang;
  const text = char.word ? letterPhrase({ id: char.id, word: char.word }, lang) : i18n.t(char.nameKey, { lng: lang });
  return { text, lang };
}
