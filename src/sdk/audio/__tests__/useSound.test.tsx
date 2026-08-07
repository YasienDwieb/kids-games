import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import { act, create } from 'react-test-renderer';
import { useSound } from '../useSound';
import { settingsStore, DEFAULT_SETTINGS } from '../../settings/store';

type Api = ReturnType<typeof useSound>;

function mountSound(): { api: () => Api } {
  let latest: Api | null = null;
  function Probe() {
    latest = useSound();
    return null;
  }
  act(() => {
    create(<Probe />);
  });
  return { api: () => latest as Api };
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
});
