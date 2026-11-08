import { i18n, type LanguageCode } from '@/sdk';

/** Said when a board appears (docs/VOICE.md). */
export function pairsPhrase(lng: LanguageCode): string {
  return i18n.t('simple-pairs:say.find', { lng });
}
