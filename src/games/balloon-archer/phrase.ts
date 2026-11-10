import { i18n, type LanguageCode } from '@/sdk';

/** Said when a level starts (docs/VOICE.md). */
export function popPhrase(lng: LanguageCode): string {
  return i18n.t('balloon-archer:say.pop', { lng });
}
