import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import { act, create } from 'react-test-renderer';
import { useSound } from '../useSound';
import { STALL_MS } from '../releasePlayer';
import { SoundOverridesContext } from '../SoundOverridesContext';
import { getAsset } from '../../assets/query';
import type { SoundOverrides } from '../../assets/query';
import { settingsStore, DEFAULT_SETTINGS } from '../../settings/store';

type Api = ReturnType<typeof useSound>;

function mountSound(overrides: SoundOverrides = {}): { api: () => Api; unmount: () => void } {
  let latest: Api | null = null;
  function Probe() {
    latest = useSound();
    return null;
  }
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <SoundOverridesContext.Provider value={overrides}>
        <Probe />
      </SoundOverridesContext.Provider>,
    );
  });
  return { api: () => latest as Api, unmount: () => act(() => tree.unmount()) };
}

/** Let the mount-time settings prime resolve. */
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('useSound', () => {
  // Regression: play() used to `await settingsStore.get()` on every call, so
  // every pop/catch/step cost an AsyncStorage round-trip plus a JSON.parse on
  // the JS thread — the same thread driving the game's motion. Games call play()
  // inside frame loops and on every drag step, so this showed up as stutter.
  it('does not read storage on the play hot path', async () => {
    const { api } = mountSound();
    await settle();

    const before = (AsyncStorage.getItem as jest.Mock).mock.calls.length;
    act(() => {
      for (let i = 0; i < 25; i++) api().play('pop');
    });

    expect((AsyncStorage.getItem as jest.Mock).mock.calls.length).toBe(before);
  });

  it('plays a sound for a known intent', async () => {
    const { api } = mountSound();
    await settle();

    act(() => {
      api().play('pop');
    });

    expect(createAudioPlayer).toHaveBeenCalled();
  });

  it('stays silent for an unknown intent', async () => {
    const { api } = mountSound();
    await settle();

    act(() => {
      api().play('definitely-not-an-intent');
    });

    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('honours soundEnabled: false without touching storage per call', async () => {
    await settingsStore.set({ ...DEFAULT_SETTINGS, soundEnabled: false });
    const { api } = mountSound();
    await settle();

    act(() => {
      api().play('pop');
    });

    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  // The cache must not go stale: flipping the setting elsewhere in the app has
  // to reach an already-mounted game.
  it('picks up a settings change while mounted', async () => {
    const { api } = mountSound();
    await settle();

    await act(async () => {
      await settingsStore.set({ ...DEFAULT_SETTINGS, soundEnabled: false });
    });

    act(() => {
      api().play('pop');
    });

    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('prewarm loads players up front so none are created mid-play', async () => {
    const { api } = mountSound();
    await settle();

    act(() => {
      api().prewarm(['pop']);
    });
    expect(createAudioPlayer).toHaveBeenCalled();

    const afterPrewarm = (createAudioPlayer as jest.Mock).mock.calls.length;
    act(() => {
      for (let i = 0; i < 30; i++) api().play('pop');
    });

    expect((createAudioPlayer as jest.Mock).mock.calls.length).toBe(afterPrewarm);
  });

  it("plays the game's override instead of the shared asset", async () => {
    const { api } = mountSound({ 'sfx.win': 'jingle.steel-15' });
    await settle();

    act(() => {
      api().play('win');
    });

    expect(createAudioPlayer).toHaveBeenCalledWith(getAsset('jingle.steel-15').modules[0]);
  });

  describe('player lifetime', () => {
    const lastPlayer = () => (createAudioPlayer as jest.Mock).mock.results.at(-1)!.value;

    it('releases its players on unmount', async () => {
      const { api, unmount } = mountSound();
      await settle();
      act(() => {
        api().prewarm(['pop']);
      });
      const player = lastPlayer();
      unmount();
      expect(player.release).toHaveBeenCalled();
    });

    // A round that unmounts right after its win sound must not cut it off.
    it('lets a sound that is still playing finish after unmount', async () => {
      jest.useFakeTimers();
      try {
        const { api, unmount } = mountSound();
        await settle();
        act(() => {
          api().prewarm(['pop']);
        });
        const player = lastPlayer();
        Object.assign(player, { playing: true, duration: 2, currentTime: 0 });
        unmount();
        expect(player.release).not.toHaveBeenCalled();
        act(() => {
          jest.advanceTimersByTime(3000);
        });
        expect(player.release).toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('rebuilds a player stuck in buffering', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      try {
        const overrides = { 'sfx.win': 'jingle.steel-15' } as SoundOverrides;
        const { api } = mountSound(overrides);
        await settle();
        act(() => {
          api().play('win');
        });
        const stuck = lastPlayer();
        stuck.isBuffering = true;
        act(() => {
          jest.advanceTimersByTime(STALL_MS);
        });
        expect(stuck.release).toHaveBeenCalled();
        act(() => {
          api().play('win');
        });
        expect(lastPlayer()).not.toBe(stuck);
      } finally {
        jest.useRealTimers();
      }
    });

    it('rebuilds a player that failed natively instead of replaying a dead one', async () => {
      const module = getAsset('jingle.steel-15').modules[0];
      const overrides = { 'sfx.win': 'jingle.steel-15' } as SoundOverrides;
      const { api } = mountSound(overrides);
      await settle();
      act(() => {
        api().play('win');
      });
      const dead = lastPlayer();
      const [, onStatus] = dead.addListener.mock.calls[0];
      act(() => onStatus({ error: 'AudioTrack init failed' }));
      expect(dead.release).toHaveBeenCalled();
      act(() => {
        api().play('win');
      });
      expect(lastPlayer()).not.toBe(dead);
      expect(createAudioPlayer).toHaveBeenLastCalledWith(module);
    });
  });
});
