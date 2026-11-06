import { i18n, type LanguageCode } from '@/sdk';

/** The spoken round prompt; `promptKey` is the round's key, e.g. 'prompts.animalFood'. */
export function matchPhrase(promptKey: string, lng: LanguageCode): string {
  return i18n.t(`match-up:${promptKey}`, { lng });
}
