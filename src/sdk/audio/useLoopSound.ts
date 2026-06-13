import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { pickModule } from '@/sdk/assets/query';
import { useSettings } from '@/sdk/settings/useSettings';

/**
 * Looping ambient sound (engine rumble, wind, …) tied to component lifecycle.
 *
 * While `active` and the soundEnabled setting are both true, a sound resolved
 * via pickModule(intent) plays with isLooping. Toggling `active` (or the
 * setting) pauses/resumes the same loaded sound; it is unloaded on unmount.
 * Unknown intents are a silent no-op (mirrors useSound).
 */
export function useLoopSound(
  intent: string,
  opts: { active: boolean; volume?: number; rate?: number },
): void {
  const { active, volume = 0.35, rate = 1 } = opts;
  const { settings } = useSettings();
  const shouldPlay = active && settings.soundEnabled;

  const soundRef = useRef<Audio.Sound | null>(null);
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
      // Intent changed under a loaded sound → drop it and recreate below.
      if (soundRef.current && loadedIntentRef.current !== intent) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        loadedIntentRef.current = null;
      }

      if (!shouldPlay) {
        soundRef.current?.pauseAsync().catch(() => {});
        return;
      }

      if (soundRef.current) {
        try {
          await soundRef.current.playAsync();
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
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
        const { sound } = await Audio.Sound.createAsync(module, {
          isLooping: true,
          shouldPlay: true,
          volume: volumeRef.current,
        });
        if (!mountedRef.current) {
          // Unmounted while createAsync was in flight.
          sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        loadedIntentRef.current = intent;
        if (rateRef.current !== 1) {
          try {
            await sound.setRateAsync(rateRef.current, false);
          } catch {
            // rate unsupported on some platforms — degrade silently
          }
        }
        if (!shouldPlayRef.current) sound.pauseAsync().catch(() => {});
      } catch {
        // graceful degradation — game works without sound
      } finally {
        creatingRef.current = false;
      }
    };
    sync();
  }, [shouldPlay, intent]);

  // Volume changes on the live sound.
  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume).catch(() => {});
  }, [volume]);

  // Rate changes — no pitch correction; unsupported platforms degrade silently.
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;
    (async () => {
      try {
        await sound.setRateAsync(rate, false);
      } catch {
        // rate unsupported on some platforms — degrade silently
      }
    })();
  }, [rate]);

  // Unmount cleanup.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      loadedIntentRef.current = null;
    };
  }, []);
}
