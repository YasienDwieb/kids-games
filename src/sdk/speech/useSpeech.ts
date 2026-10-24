import { useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { currentLanguage } from '@/sdk/i18n';
import type { LanguageCode } from '@/sdk/i18n/types';
import { settingsStore } from '@/sdk/settings/store';
import { voiceHoldRemaining } from './voiceGate';
import { clipKey } from './clipKey';
import { CLIPS } from './clips.generated';

/** `language` overrides the app language, e.g. an Arabic letter spoken in an English UI. */
export type SpeakOptions = { rate?: number; pitch?: number; language?: LanguageCode };

/** IETF BCP 47 locale per app language. */
const LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  ar: 'ar',
};

/** Kid-friendly defaults — a touch slower & higher so letters are clear. */
const DEFAULT_RATE = 0.7;
const DEFAULT_PITCH = 1.1;

// Bundled clips (docs/VOICE.md): one player per clip, and one clip at a time app-wide.
const players = new Map<number, AudioPlayer>();
let currentClip: AudioPlayer | null = null;

function stopAll() {
  try {
    Speech.stop();
  } catch {
    // no-op
  }
  try {
    currentClip?.pause();
  } catch {
    // already released
  }
  currentClip = null;
}

function playClip(module: number) {
  let player = players.get(module);
  if (!player) {
    player = createAudioPlayer(module);
    players.set(module, player);
  }
  player.seekTo(0); // expo-audio doesn't auto-rewind on finish
  player.play();
  currentClip = player;
}

/**
 * Speech for games: plays the bundled clip for `"<lang>:<text>"` when one exists,
 * else the device's text-to-speech. Deliberately NOT gated by any sound setting:
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
      stopAll();
    };
  }, []);

  const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
    await settingsStore.get();
    const wait = voiceHoldRemaining();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    // Bail if we unmounted during the AsyncStorage await — otherwise the
    // unmount's Speech.stop() would race ahead and this would speak on the
    // next screen.
    if (!mounted.current) return;

    const lang = options.language ?? currentLanguage();
    const language = LOCALE[lang] ?? LOCALE.en;
    try {
      // Replace any in-flight clip/utterance — expo-speech queues otherwise.
      stopAll();
      const clip = CLIPS[clipKey(lang, text)];
      if (clip !== undefined) {
        playClip(clip);
        return;
      }
      Speech.speak(text, {
        language,
        rate: options.rate ?? DEFAULT_RATE,
        pitch: options.pitch ?? DEFAULT_PITCH,
      });
    } catch {
      // graceful degradation — game works without speech
    }
  }, []);

  const stop = useCallback(() => stopAll(), []);

  return { speak, stop };
}
