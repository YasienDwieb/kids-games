import { i18n, type LanguageCode } from '@/sdk';

/** The spoken animal name (docs/VOICE.md). */
export function animalPhrase(id: string, lng: LanguageCode): string {
  return i18n.t(`animal-safari:names.${id}`, { lng });
}
