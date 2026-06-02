import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from '../createStore';

describe('createStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the default when unset', async () => {
    const store = createStore('game-a', { score: 0 });
    expect(await store.get()).toEqual({ score: 0 });
  });

  it('persists under a namespaced key', async () => {
    const store = createStore('game-a', { score: 0 });
    await store.set({ score: 5 });
    expect(await store.get()).toEqual({ score: 5 });
    expect(await AsyncStorage.getItem('kg:game-a')).toBe(JSON.stringify({ score: 5 }));
  });

  it('isolates namespaces', async () => {
    const a = createStore('game-a', { score: 0 });
    const b = createStore('game-b', { score: 0 });
    await a.set({ score: 1 });
    expect(await b.get()).toEqual({ score: 0 });
  });

  it('notifies subscribers on set', async () => {
    const store = createStore('game-a', { score: 0 });
    const seen: number[] = [];
    store.subscribe((v) => seen.push(v.score));
    await store.set({ score: 7 });
    expect(seen).toEqual([7]);
  });
});
