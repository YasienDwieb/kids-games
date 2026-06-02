import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { pickAsset, getAsset } from '@/sdk/assets/query';
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

    const id = pickAsset(intent);
    if (!id) return; // graceful: unknown intent → silent

    try {
      if (loaded.current[id]) {
        await loaded.current[id].replayAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync(getAsset(id).module, { shouldPlay: true });
      loaded.current[id] = sound;
    } catch {
      // graceful degradation — game works without sound
    }
  }, []);

  return { play };
}
