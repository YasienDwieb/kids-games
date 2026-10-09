import { currentLanguage } from '@/sdk';
import { ARABIC_LETTERS, LATIN_LETTERS } from '../constants';
import type { Letter } from '../types';

// Keyed off the chosen language, not I18nManager.isRTL: native RTL can lag the
// language (Expo Go, or before the switch reload), and the alphabet must always
// match the language the prompts are spoken in.
export function letterSet(): readonly Letter[] {
  return currentLanguage() === 'ar' ? ARABIC_LETTERS : LATIN_LETTERS;
}
