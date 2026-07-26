import AsyncStorage from '@react-native-async-storage/async-storage';

export type Store<T> = {
  get: () => Promise<T>;
  set: (value: T) => Promise<void>;
  subscribe: (fn: (value: T) => void) => () => void;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function createStore<T>(namespace: string, defaultValue: T): Store<T> {
  const key = `kg:${namespace}`;
  const subscribers = new Set<(value: T) => void>();

  return {
    async get() {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return defaultValue;
      try {
        const parsed = JSON.parse(raw);
        // Fill in keys the stored blob predates. Without this, every field added
        // to a store after release reads back `undefined` for existing users —
        // so a new boolean setting would silently behave as "off" for everyone
        // who already had the app. Guarded because stores may hold primitives.
        if (isPlainObject(defaultValue) && isPlainObject(parsed)) {
          return { ...defaultValue, ...parsed } as T;
        }
        return parsed as T;
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
