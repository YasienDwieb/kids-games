import type { ComponentType } from 'react';
import type { AccentName } from '@/constants';
import type { SoundOverrides } from '@/sdk/assets/query';

export type GameLayoutOptions = {
  /** 'shell' (default) wraps the game in GameShell; 'bare' gives a raw safe-area canvas. */
  mode?: 'shell' | 'bare';
  /** Hide the back button (default: shown). */
  showBack?: boolean;
};

/** Home-screen filter group. */
export type GameCategory = 'numbers' | 'words' | 'action' | 'puzzles';

export const GAME_CATEGORIES: readonly GameCategory[] = ['numbers', 'words', 'action', 'puzzles'];

export type GameConfig = {
  id: string;
  name: string;
  description: string;
  icon: string;
  ageRange: { min: number; max: number };
  component: ComponentType;
  backgroundColor: string;
  // Optional, backward-compatible enrichment:
  /** Design-system accent for the home tile (falls back to a derived accent). */
  accent?: AccentName;
  /**
   * Home-screen sort weight, ascending. Only ~3 tiles are visible at once on a
   * landscape phone, so the first few decide the app's first impression. Without
   * this the order is whatever `src/games/index.ts` happens to import first.
   * Games with no `order` sort last, in registration order.
   */
  order?: number;
  tags?: string[];
  /** Home filter chip this game shows under (it always shows under "All"). */
  category?: GameCategory;
  layout?: GameLayoutOptions;
  /**
   * Swap shared sounds for this game only, e.g. `{ 'sfx.win': 'jingle.sax-10' }`
   * gives it its own win jingle. Every `play()` inside the game picks it up.
   */
  sounds?: SoundOverrides;
  bands?: string[];
  version?: string;
  author?: string;
};

export type GameRegistry = Record<string, GameConfig>;
