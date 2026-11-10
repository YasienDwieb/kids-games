/**
 * Say a buddy's welcome line: the clip recorded for a custom name when there
 * is one, else the bundled line. Honours the sound setting like `useSound`.
 *
 *   const { say } = useWelcome();
 *   say('anas');
 */
import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSound } from '@/sdk/audio/useSound';
import { releasePlayer, releaseWhenDone } from '@/sdk/audio/releasePlayer';
import { currentLanguage } from '@/sdk/i18n';
import { DEFAULT_SETTINGS, settingsStore, type Settings } from '@/sdk/settings/store';
import { welcomeIntent, type BuddyId } from './index';
import { customWelcomeClip, nameLangOf } from './names';

export function useWelcome() {
  const { play, prewarm, stop } = useSound();
  const custom = useRef<AudioPlayer | null>(null);
  const settings = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    settingsStore
      .get()
      .then((s) => (settings.current = s))
      .catch(() => {});
    const unsub = settingsStore.subscribe((s) => (settings.current = s));
    return () => {
      unsub();
      if (custom.current) releaseWhenDone(custom.current);
      custom.current = null;
    };
  }, []);

  const silence = useCallback(() => {
    stop();
    if (custom.current) releasePlayer(custom.current);
    custom.current = null;
  }, [stop]);

  const say = useCallback(
    (buddy: BuddyId) => {
      silence();
      const lang = currentLanguage();
      const uri = customWelcomeClip(buddy, nameLangOf(lang));
      if (!uri) {
        play(welcomeIntent(buddy, lang), { haptic: true });
        return;
      }
      if (settings.current.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (!settings.current.soundEnabled) return;
      try {
        const player = createAudioPlayer({ uri });
        custom.current = player;
        player.play();
      } catch {
        play(welcomeIntent(buddy, lang), { haptic: false });
      }
    },
    [play, silence],
  );

  const warm = useCallback(
    (buddy: BuddyId) => {
      if (!customWelcomeClip(buddy, nameLangOf(currentLanguage()))) prewarm([welcomeIntent(buddy, currentLanguage())]);
    },
    [prewarm],
  );

  return { say, warm, stop: silence };
}
