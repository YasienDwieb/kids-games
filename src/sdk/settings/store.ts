import { createStore } from '@/sdk/storage/createStore';

export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ageBand: string | null;
  /** Selected app language code (e.g. 'en', 'ar'). Null = follow device on first boot. */
  language: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  ageBand: null,
  language: null,
};

export const settingsStore = createStore<Settings>('settings', DEFAULT_SETTINGS);
