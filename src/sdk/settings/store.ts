import { createStore } from '@/sdk/storage/createStore';

export type Settings = {
  /**
   * Sound EFFECTS only: pops, celebration, wrong-answer stings. Decoration.
   * Deliberately separate from `voiceEnabled` — in the listen-and-find games
   * (letter-land, numbers-land, animal-safari) the spoken prompt IS the
   * question, so muting effects must not make those games unanswerable.
   */
  soundEnabled: boolean;
  /** Spoken instructions and letter/number names. Content, not decoration. */
  voiceEnabled: boolean;
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
  voiceEnabled: true,
  hapticsEnabled: true,
  ageBand: null,
  language: null,
  mode: 'free',
  flowGameIds: null,
};

export const settingsStore = createStore<Settings>('settings', DEFAULT_SETTINGS);
