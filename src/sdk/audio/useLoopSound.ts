import { useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { pickModule } from '@/sdk/assets/query';
import { useSettings } from '@/sdk/settings/useSettings';

/**
 * Looping ambient sound (engine rumble, wind, …) tied to component lifecycle.
 *
 * While `active` and the soundEnabled setting are both true, a sound resolved
 * via pickModule(intent) plays with looping. Toggling `active` (or the
 * setting) pauses/resumes the same loaded player; it is removed on unmount.
 * Unknown intents are a silent no-op (mirrors useSound).
 */
export function useLoopSound(
  intent: string,
  opts: { active: boolean; volume?: number; rate?: number },
): void {
  const { active, volume = 0.35, rate = 1 } = opts;
  const { settings } = useSettings();
  const shouldPlay = active && settings.soundEnabled;

  const playerRef = useRef<AudioPlayer | null>(null);
  const loadedIntentRef = useRef<string | null>(null);
  const creatingRef = useRef(false);
  const mountedRef = useRef(true);
  // Latest props, readable from in-flight async work without re-running effects.
  const shouldPlayRef = useRef(shouldPlay);
  const volumeRef = useRef(volume);
  const rateRef = useRef(rate);
  shouldPlayRef.current = shouldPlay;
  volumeRef.current = volume;
  rateRef.current = rate;

  // Play / pause / lazy-create.
  useEffect(() => {
    const sync = async () => {
      // Intent changed under a loaded player → drop it and recreate below.
      if (playerRef.current && loadedIntentRef.current !== intent) {
        try {
          playerRef.current.remove();
        } catch {
          // already released — ignore
        }
        playerRef.current = null;
        loadedIntentRef.current = null;
      }

      if (!shouldPlay) {
        try {
          playerRef.current?.pause();
        } catch {
          // graceful degradation — game works without sound
        }
        return;
      }

      if (playerRef.current) {
        try {
          playerRef.current.play();
        } catch {
          // graceful degradation — game works without sound
        }
        return;
      }

      if (creatingRef.current) return; // a create is already in flight
      const module = pickModule(intent);
      if (module === undefined) return; // graceful: unknown intent → silent

      creatingRef.current = true;
      try {
        await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
        const player = createAudioPlayer(module);
        if (!mountedRef.current) {
          // Unmounted while the effect was in flight.
          try {
            player.remove();
          } catch {
            // already released — ignore
          }
          return;
        }
        player.loop = true;
        player.volume = volumeRef.current;
        playerRef.current = player;
        loadedIntentRef.current = intent;
        if (rateRef.current !== 1) {
          try {
            player.setPlaybackRate(rateRef.current);
          } catch {
            // rate unsupported on some platforms — degrade silently
          }
        }
        if (shouldPlayRef.current) player.play();
      } catch {
        // graceful degradation — game works without sound
      } finally {
        creatingRef.current = false;
      }
    };
    sync();
  }, [shouldPlay, intent]);

  // Volume changes on the live player.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.volume = volume;
    } catch {
      // graceful degradation — game works without sound
    }
  }, [volume]);

  // Rate changes — no pitch correction; unsupported platforms degrade silently.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.setPlaybackRate(rate);
    } catch {
      // rate unsupported on some platforms — degrade silently
    }
  }, [rate]);

  // Unmount cleanup.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        playerRef.current?.remove();
      } catch {
        // already released — ignore
      }
      playerRef.current = null;
      loadedIntentRef.current = null;
    };
  }, []);
}
