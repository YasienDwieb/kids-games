import type { ComponentType } from 'react';
import type { AccentName } from '@/constants';

export type GameLayoutOptions = {
  /** 'shell' (default) wraps the game in GameShell; 'bare' gives a raw safe-area canvas. */
  mode?: 'shell' | 'bare';
  /** Override the header title (defaults to game name). */
  title?: string;
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
  tags?: string[];
  layout?: GameLayoutOptions;
  bands?: string[];
  version?: string;
  author?: string;
};

export type GameRegistry = Record<string, GameConfig>;
