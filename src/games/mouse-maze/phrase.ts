import { i18n, type LanguageCode } from '@/sdk';

/** Said when a maze appears (docs/VOICE.md). */
export function mazePhrase(lng: LanguageCode): string {
  return i18n.t('mouse-maze:say.find', { lng });
}
