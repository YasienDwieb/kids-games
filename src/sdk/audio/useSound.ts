import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { pickModule } from '@/sdk/assets/query';
import { settingsStore } from '@/sdk/settings/store';

export type PlayOptions = { haptic?: boolean };

export function useSound() {
  const loaded = useRef<Record<string, Audio.Sound>>({});

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    const cache = loaded.current;
    return () => {
      Object.values(cache).forEach((s) => s.unloadAsync().catch(() => {}));
      loaded.current = {};
    };
  }, []);

  const play = useCallback(async (intent: string, options: PlayOptions = {}) => {
    const settings = await settingsStore.get();

    if (settings.hapticsEnabled && options.haptic !== false) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    if (!settings.soundEnabled) return;

    const module = pickModule(intent); // random variant for the intent
    if (module === undefined) return; // graceful: unknown intent → silent

    const key = String(module);
    try {
      if (loaded.current[key]) {
        await loaded.current[key].replayAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync(module, { shouldPlay: true });
      loaded.current[key] = sound;
    } catch {
      // graceful degradation — game works without sound
    }
  }, []);

  return { play };
}
