import { i18n, type LanguageCode } from '@/sdk';
import type { Letter } from './index';

/** The spoken letter prompt: "<name>! <Word>" in English, «<name>. <Word>» in Arabic (docs/VOICE.md). */
export function letterPhrase(letter: Pick<Letter, 'id' | 'word'>, lng: LanguageCode): string {
  const name = i18n.t(`letters:names.${letter.id}`, { lng });
  const word = i18n.t(`letters:words.${letter.word}`, { lng });
  // English starts a sentence with the word: "Q! Queen".
  const spokenWord = lng === 'en' ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  return i18n.t('letters:speak.carrier', { lng, name, word: spokenWord });
}
