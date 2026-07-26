import type { ComponentType } from 'react';
import type { AccentName } from '@/constants';

export type GameLayoutOptions = {
  /** 'shell' (default) wraps the game in GameShell; 'bare' gives a raw safe-area canvas. */
  mode?: 'shell' | 'bare';
  /** Hide the back button (default: shown). */
  showBack?: boolean;
};

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
  layout?: GameLayoutOptions;
  bands?: string[];
  version?: string;
  author?: string;
};

export type GameRegistry = Record<string, GameConfig>;
