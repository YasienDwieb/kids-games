import { i18n, type LanguageCode } from '@/sdk';

/** The spoken number prompt (docs/VOICE.md). */
export function numberPhrase(id: string, lng: LanguageCode): string {
  const name = i18n.t(`numbers-land:names.${id}`, { lng });
  return i18n.t('numbers-land:speak.carrier', { lng, name });
}
