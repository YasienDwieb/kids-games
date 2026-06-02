import { createStore } from '@/sdk/storage/createStore';

export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ageBand: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  ageBand: null,
};

export const settingsStore = createStore<Settings>('settings', DEFAULT_SETTINGS);
