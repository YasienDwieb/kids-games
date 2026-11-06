import { i18n, type LanguageCode } from '@/sdk';
import type { RoundMode } from './types';

/** "Pop three!" — the spoken count-this-many prompt (docs/VOICE.md). */
export function popPhrase(count: number, lng: LanguageCode): string {
  return i18n.t('count-and-pop:say.pop', { lng, name: i18n.t(`count-and-pop:numbers.${count}`, { lng }) });
}

/** The spoken question for the choice-row modes. */
export function questionPhrase(mode: Exclude<RoundMode, 'countThisMany'>, lng: LanguageCode): string {
  return i18n.t(`count-and-pop:say.${mode}`, { lng });
}
