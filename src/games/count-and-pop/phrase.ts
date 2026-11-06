import { i18n, type LanguageCode } from '@/sdk';
import type { RoundMode } from './types';

/** "Pop three!" — the spoken count-this-many prompt (docs/VOICE.md). */
export function popPhrase(count: number, lng: LanguageCode): string {
  return i18n.t('count-and-pop:say.pop', { lng, name: i18n.t(`count-and-pop:numbers.${count}`, { lng }) });
}

/** "How many more to make five?" — says the target, which the tray's flag shows. */
export function makePhrase(target: number, lng: LanguageCode): string {
  const key = target === 2 ? 'targets.2' : `numbers.${target}`;
  return i18n.t('count-and-pop:say.makeN', { lng, name: i18n.t(`count-and-pop:${key}`, { lng }) });
}

/** The spoken question for the other choice-row modes. */
export function questionPhrase(mode: Exclude<RoundMode, 'countThisMany' | 'makeN'>, lng: LanguageCode): string {
  return i18n.t(`count-and-pop:say.${mode}`, { lng });
}
