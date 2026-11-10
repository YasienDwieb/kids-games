import { i18n, type LanguageCode } from '@/sdk';
import type { Challenge, ColorId } from './types';

/** The spoken colour goal, «<makeThisColor> <colour>» (docs/VOICE.md). */
export function colorTargetPhrase(id: ColorId, lng: LanguageCode): string {
  return `${i18n.t('color-mixer:challenge.makeThisColor', { lng })} ${i18n.t(`color-mixer:colors.${id}`, { lng })}`;
}

/** What a challenge asks for: its colour's name, or for a mystery colour, "this color". */
export function goalPhrase(c: Challenge, lng: LanguageCode): string {
  return c.targetColor ? colorTargetPhrase(c.targetColor, lng) : paintPhrase(lng);
}

/** An endless mystery colour has no name: "Paint it this color!". */
export function paintPhrase(lng: LanguageCode): string {
  return i18n.t('color-mixer:say.paint', { lng });
}

/** The empty pot's hint, said with the demo hand — the pot itself shows no words. */
export function dragHintPhrase(lng: LanguageCode): string {
  return i18n.t('color-mixer:mixingZone.dragHint', { lng });
}

/** The name of a colour on its own — said when the pot turns that colour. */
export function colorNamePhrase(id: ColorId, lng: LanguageCode): string {
  return i18n.t(`color-mixer:colors.${id}`, { lng });
}
