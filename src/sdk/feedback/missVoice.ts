/**
 * A short spoken cue for a child who is stuck. The first miss stays sound-only;
 * from the second on, `useHintLadder` speaks this through the CelebrationProvider.
 * It must stay about as short as the gap before the next try, so a new miss can
 * cut it off rather than stack on it. Recorded like game prompts (docs/VOICE.md).
 */
import { createContext } from 'react';
import { i18n } from '@/sdk/i18n';
import type { LanguageCode } from '@/sdk/i18n/types';

/** The cue starts as the wrong-answer sound ends. */
export const MISS_SFX_GAP_MS = 220;
/** Covers the clip; guarded against the recording by a test. */
export const MISS_HOLD_MS: Record<LanguageCode, number> = { en: 1100, ar: 1300 };

export function missPhrase(lng: LanguageCode): string {
  return i18n.t('core:feedback.miss.tryAgain', { lng });
}

export function shouldSpeakMiss(misses: number): boolean {
  return misses >= 2;
}

/** Offer the cue for the round's `misses`-th wrong attempt. */
export type MissVoice = (misses: number) => void;

/** No-op without a provider, like useCelebrate. */
export const MissVoiceContext = createContext<MissVoice>(() => {});
