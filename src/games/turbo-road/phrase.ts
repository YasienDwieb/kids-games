import { i18n, type LanguageCode } from '@/sdk';

/** Said as a drive starts (docs/VOICE.md). */
export function drivePhrase(lng: LanguageCode): string {
  return i18n.t('turbo-road:say.drive', { lng });
}
