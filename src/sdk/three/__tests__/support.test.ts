import AsyncStorage from '@react-native-async-storage/async-storage';
import { acquireGlSlot, bootGl3D, HEAVY_3D_MEMORY, MIN_3D_MEMORY, resetGl3D, supportFor } from '../support';

const KEY = 'kg:gl3d';
const stored = async () => JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');

beforeEach(async () => {
  resetGl3D();
  await AsyncStorage.clear();
});

describe('supportFor', () => {
  it('turns 3D off on this build after a GL start-up crash', () => {
    expect(supportFor({ os: 'ios', totalMemory: 8e9, crashedHere: true })).toBe('off');
  });

  it('keeps iOS on full 3D', () => {
    expect(supportFor({ os: 'ios', totalMemory: 2e9, crashedHere: false })).toBe('full');
  });

  it('grades Android by memory', () => {
    const at = (totalMemory: number | null) => supportFor({ os: 'android', totalMemory, crashedHere: false });
    expect(at(MIN_3D_MEMORY - 1)).toBe('off');
    expect(at(MIN_3D_MEMORY)).toBe('lite');
    expect(at(HEAVY_3D_MEMORY)).toBe('full');
    expect(at(null)).toBe('lite');
  });

  it('places real devices by the memory Android reports, not the box size', () => {
    const GiB = 1024 ** 3;
    const at = (reported: number) => supportFor({ os: 'android', totalMemory: reported * GiB, crashedHere: false });
    expect(at(1.8)).toBe('off'); // "2 GB" phone
    expect(at(2.7)).toBe('lite'); // "3 GB"
    expect(at(3.6)).toBe('lite'); // "4 GB"
    expect(at(5.5)).toBe('full'); // "6 GB"
  });
});

describe('GL start-up marker', () => {
  it('is set while a context starts and cleared once it is created', async () => {
    const slot = await acquireGlSlot();
    expect((await stored()).pending).toBe(true);
    slot.created();
    await new Promise((r) => setTimeout(r, 0));
    expect((await stored()).pending).toBe(false);
  });

  it('disables 3D for this build when the last launch died starting GL', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ pending: true, disabledBuild: null }));
    expect(await bootGl3D()).toBe('off');
    expect(await stored()).toEqual({ pending: false, disabledBuild: expect.any(String) });
  });

  it('starts contexts one at a time', async () => {
    const order: string[] = [];
    const first = await acquireGlSlot();
    const second = acquireGlSlot().then((s) => {
      order.push('second');
      return s;
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(order).toEqual([]);
    first.created();
    (await second).created();
    expect(order).toEqual(['second']);
  });
});
