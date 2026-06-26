import { useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { currentLanguage } from '@/sdk/i18n';
import type { LanguageCode } from '@/sdk/i18n/types';
import { settingsStore } from '@/sdk/settings/store';

export type SpeakOptions = { rate?: number; pitch?: number };

/** IETF BCP 47 locale per app language. */
const LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  ar: 'ar',
};

/** Kid-friendly defaults — a touch slower & higher so letters are clear. */
const DEFAULT_RATE = 0.7;
const DEFAULT_PITCH = 1.1;

/**
 * Text-to-speech for games. Mirrors useSound: gates on settings.soundEnabled,
 * degrades gracefully (no-op on throw), and cancels any in-flight utterance on
 * unmount. Each speak() replaces any in-flight/queued utterance (Speech.stop()
 * before Speech.speak()) so rapid calls don't stack. After awaiting settings,
 * speak() bails if the component has unmounted, so a late-resolving call can't
 * fire on the next screen. Locale follows the active app language via
 * currentLanguage().
 */
export function useSpeech() {
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      try {
        Speech.stop();
      } catch {
        // no-op
      }
    };
  }, []);

  const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
    const settings = await settingsStore.get();

    if (!settings.soundEnabled) return;
    // Bail if we unmounted during the AsyncStorage await — otherwise the
    // unmount's Speech.stop() would race ahead and this would speak on the
    // next screen.
    if (!mounted.current) return;

    const language = LOCALE[currentLanguage()] ?? LOCALE.en;
    try {
      // Replace any in-flight/queued utterance — expo-speech queues otherwise.
      Speech.stop();
      Speech.speak(text, {
        language,
        rate: options.rate ?? DEFAULT_RATE,
        pitch: options.pitch ?? DEFAULT_PITCH,
      });
    } catch {
      // graceful degradation — game works without speech
    }
  }, []);

  const stop = useCallback(() => {
    try {
      Speech.stop();
    } catch {
      // no-op
    }
  }, []);

  return { speak, stop };
}
