import AsyncStorage from '@react-native-async-storage/async-storage';

export type Store<T> = {
  get: () => Promise<T>;
  set: (value: T) => Promise<void>;
  subscribe: (fn: (value: T) => void) => () => void;
};

export function createStore<T>(namespace: string, defaultValue: T): Store<T> {
  const key = `kg:${namespace}`;
  const subscribers = new Set<(value: T) => void>();

  return {
    async get() {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return defaultValue;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return defaultValue;
      }
    },
    async set(value) {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      subscribers.forEach((fn) => fn(value));
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
