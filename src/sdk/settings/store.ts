import { createStore } from '@/sdk/storage/createStore';

export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ageBand: string | null;
  /** Selected app language code (e.g. 'en', 'ar'). Null = follow device on first boot. */
  language: string | null;
  /** Active app mode. 'free' = game grid (default); 'guided' = the learning journey. */
  mode: 'free' | 'guided';
  /** Topic ids included in the guided journey; null = all authored topics. */
  flowTopicIds: string[] | null;
  /** Whether guided mode tracks score. Default false (non-blaming, learning-first). */
  flowScoring: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  ageBand: null,
  language: null,
  mode: 'free',
  flowTopicIds: null,
  flowScoring: false,
};

export const settingsStore = createStore<Settings>('settings', DEFAULT_SETTINGS);
