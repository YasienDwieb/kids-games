import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { modulesFor, pickModule } from '@/sdk/assets/query';
import { settingsStore, DEFAULT_SETTINGS, type Settings } from '@/sdk/settings/store';

export type PlayOptions = { haptic?: boolean };

export function useSound() {
  const loaded = useRef<Record<string, AudioPlayer>>({});
  /* Settings are mirrored here rather than read per call. play() is invoked from
     frame loops and from every drag step, and `settingsStore.get()` is an
     AsyncStorage round-trip plus a JSON.parse — on the JS thread, the same one
     driving the game. Reading a ref keeps the hot path free of both. */
  const settings = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let mounted = true;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    settingsStore
      .get()
      .then((s) => {
        if (mounted) settings.current = s;
      })
      .catch(() => {}); // graceful: fall back to defaults
    const unsub = settingsStore.subscribe((s) => {
      settings.current = s;
    });

    const cache = loaded.current;
    return () => {
      mounted = false;
      unsub();
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

  const playerFor = useCallback((module: number): AudioPlayer | undefined => {
    const key = String(module);
    const existing = loaded.current[key];
    if (existing) return existing;
    try {
      const player = createAudioPlayer(module);
      loaded.current[key] = player;
      return player;
    } catch {
      return undefined; // graceful degradation — game works without sound
    }
  }, []);

  /**
   * Load every variant of the given intents now, so no player is constructed
   * mid-play. Each intent carries several interchangeable variants, and the
   * first time each one came up it was created on the spot — a file load in the
   * middle of a level. Call this once when a game starts.
   */
  const prewarm = useCallback(
    (intents: readonly string[]) => {
      for (const intent of intents) {
        for (const module of modulesFor(intent)) playerFor(module);
      }
    },
    [playerFor],
  );

  const play = useCallback(
    (intent: string, options: PlayOptions = {}) => {
      const current = settings.current;

      if (current.hapticsEnabled && options.haptic !== false) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }

      if (!current.soundEnabled) return;

      const module = pickModule(intent); // random variant for the intent
      if (module === undefined) return; // graceful: unknown intent → silent

      const player = playerFor(module);
      if (!player) return;
      try {
        player.seekTo(0); // expo-audio doesn't auto-rewind on finish
        player.play();
      } catch {
        // graceful degradation — game works without sound
      }
    },
    [playerFor],
  );

  return { play, prewarm };
}
