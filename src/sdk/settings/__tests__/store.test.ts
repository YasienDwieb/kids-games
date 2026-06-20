import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsStore, DEFAULT_SETTINGS } from '../store';

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to sound and haptics on, no band filter', async () => {
    expect(await settingsStore.get()).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.hapticsEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.ageBand).toBeNull();
  });

  it('persists changes', async () => {
    await settingsStore.set({ ...DEFAULT_SETTINGS, soundEnabled: false });
    expect((await settingsStore.get()).soundEnabled).toBe(false);
  });
});

describe('settings defaults', () => {
  it('defaults to free mode, all games, scoreless', () => {
    expect(DEFAULT_SETTINGS.mode).toBe('free');
    expect(DEFAULT_SETTINGS.flowGameIds).toBeNull();
    expect(DEFAULT_SETTINGS.flowScoring).toBe(false);
  });

  it('keeps existing audio/lang defaults intact', () => {
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.hapticsEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.language).toBeNull();
  });
});
