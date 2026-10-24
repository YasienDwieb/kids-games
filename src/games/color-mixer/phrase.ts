import { i18n, type LanguageCode } from '@/sdk';
import type { ColorId } from './types';

/** The spoken colour goal, «<makeThisColor> <colour>» (docs/VOICE.md). */
export function colorTargetPhrase(id: ColorId, lng: LanguageCode): string {
  return `${i18n.t('color-mixer:challenge.makeThisColor', { lng })} ${i18n.t(`color-mixer:colors.${id}`, { lng })}`;
}
