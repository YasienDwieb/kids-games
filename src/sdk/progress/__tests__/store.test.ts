import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProgressStore, DEFAULT_PROGRESS } from '../store';

describe('createProgressStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to level 1 with zero score', async () => {
    const store = createProgressStore('mouse-maze');
    expect(await store.get()).toEqual(DEFAULT_PROGRESS);
    expect(DEFAULT_PROGRESS.level).toBe(1);
    expect(DEFAULT_PROGRESS.score).toBe(0);
  });

  it('persists under a progress-namespaced key', async () => {
    const store = createProgressStore('mouse-maze');
    await store.set({ level: 3, score: 12, updatedAt: 100 });
    expect(await store.get()).toEqual({ level: 3, score: 12, updatedAt: 100 });
    expect(await AsyncStorage.getItem('kg:progress:mouse-maze')).toBe(
      JSON.stringify({ level: 3, score: 12, updatedAt: 100 }),
    );
  });

  it('isolates progress per game id', async () => {
    const a = createProgressStore('game-a');
    const b = createProgressStore('game-b');
    await a.set({ level: 5, score: 0, updatedAt: 0 });
    expect((await b.get()).level).toBe(1);
  });
});
