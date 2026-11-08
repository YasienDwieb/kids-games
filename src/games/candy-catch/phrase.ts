import { i18n, type LanguageCode } from '@/sdk';

/** Said as the catching starts (docs/VOICE.md). */
export function catchPhrase(lng: LanguageCode): string {
  return i18n.t('candy-catch:start.title', { lng });
}
