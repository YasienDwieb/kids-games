import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { pickModule } from '@/sdk/assets/query';
import { settingsStore } from '@/sdk/settings/store';

export type PlayOptions = { haptic?: boolean };

export function useSound() {
  const loaded = useRef<Record<string, AudioPlayer>>({});

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const cache = loaded.current;
    return () => {
      Object.values(cache).forEach((p) => {
        try {
          p.remove();
        } catch {
          // already released — ignore
        }
      });
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
      const existing = loaded.current[key];
      if (existing) {
        existing.seekTo(0); // expo-audio doesn't auto-rewind on finish
        existing.play();
        return;
      }
      const player = createAudioPlayer(module);
      loaded.current[key] = player;
      player.play();
    } catch {
      // graceful degradation — game works without sound
    }
  }, []);

  return { play };
}
