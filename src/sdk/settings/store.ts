import { createStore } from '@/sdk/storage/createStore';

export type Settings = {
  /**
   * Sound EFFECTS only: pops, celebration, wrong-answer stings. Decoration.
   * Spoken prompts are deliberately NOT covered — in the listen-and-find games
   * the voice asks the question, so muting it would leave the child staring at
   * "which letter is this?" with nothing to hear.
   */
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ageBand: string | null;
  /** Selected app language code (e.g. 'en', 'ar'). Null = follow device on first boot. */
  language: string | null;
  /** Active app mode. 'free' = game grid (default); 'guided' = the learning journey. */
  mode: 'free' | 'guided';
  /** Game ids whose content feeds the guided journey; null = all eligible games. */
  flowGameIds: string[] | null;
};

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  ageBand: null,
  language: null,
  mode: 'free',
  flowGameIds: null,
};

export const settingsStore = createStore<Settings>('settings', DEFAULT_SETTINGS);
