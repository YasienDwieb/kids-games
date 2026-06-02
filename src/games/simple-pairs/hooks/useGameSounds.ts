import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

const SOUNDS: Record<string, number> = {
  flip: require('@/sdk/assets/audio/Blip1.wav'),
  match: require('@/sdk/assets/audio/Powerup3.wav'),
  mismatch: require('@/sdk/assets/audio/sfx-jump.wav'),
  win: require('@/sdk/assets/audio/Laser-weapon1.wav'),
};

export function useGameSounds() {
  const loaded = useRef<Record<string, Audio.Sound>>({});

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});

    return () => {
      Object.values(loaded.current).forEach((sound) => {
        sound.unloadAsync().catch(() => {});
      });
      loaded.current = {};
    };
  }, []);

  const play = useCallback(async (key: string) => {
    const source = SOUNDS[key];
    if (source == null) return;

    try {
      // Reuse loaded sound or create new one
      if (loaded.current[key]) {
        await loaded.current[key].replayAsync();
        return;
      }

      const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
      loaded.current[key] = sound;
    } catch {
      // Graceful degradation — game works fine without sounds
    }
  }, []);

  const playFlip = useCallback(() => play('flip'), [play]);
  const playMatch = useCallback(() => play('match'), [play]);
  const playMismatch = useCallback(() => play('mismatch'), [play]);
  const playWin = useCallback(() => play('win'), [play]);

  return { playFlip, playMatch, playMismatch, playWin };
}
