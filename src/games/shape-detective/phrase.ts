import { i18n, type LanguageCode } from '@/sdk';
import type { PuzzleType } from './types';

/** The spoken instruction for a puzzle type (docs/VOICE.md). */
export function puzzlePhrase(type: PuzzleType, lng: LanguageCode): string {
  return i18n.t(`shape-detective:${type}.instruction`, { lng });
}
