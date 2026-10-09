import AsyncStorage from '@react-native-async-storage/async-storage';

const mockReloadAsync = jest.fn(() => Promise.resolve());
jest.mock('expo-updates', () => ({ reloadAsync: () => mockReloadAsync() }));

function freshModule() {
  let mod!: typeof import('../reload');
  jest.isolateModules(() => {
    mod = require('../reload');
  });
  return mod;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockReloadAsync.mockClear();
});

describe('reloadApp boot guard', () => {
  it('reloads once at boot, then gives up when the direction still mismatches', async () => {
    expect(await freshModule().reloadApp('boot')).toBe(true);
    expect(await freshModule().reloadApp('boot')).toBe(false);
    expect(await freshModule().reloadApp('boot')).toBe(false);
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });

  it('does not depend on how long the reload took', async () => {
    jest.useFakeTimers();
    try {
      expect(await freshModule().reloadApp('boot')).toBe(true);
      jest.advanceTimersByTime(60_000);
      expect(await freshModule().reloadApp('boot')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('a language switch re-arms the boot retry', async () => {
    await freshModule().reloadApp('boot');
    await freshModule().reloadApp('boot');
    expect(await freshModule().reloadApp('switch')).toBe(true);
    expect(await freshModule().reloadApp('boot')).toBe(false);
    expect(mockReloadAsync).toHaveBeenCalledTimes(2);
  });

  it('a settled boot clears the pending state', async () => {
    await freshModule().reloadApp('boot');
    await freshModule().settleReload();
    expect(await freshModule().reloadApp('boot')).toBe(true);
  });
});
