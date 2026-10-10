import type { Difficulty } from './types';
import { ACCENTS, COLORS } from '@/sdk';

export const CARD_IMAGES = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🦁', '🐮', '🐵', '🦄', '🐧'];

export const TIMING = {
  FLIP_DURATION: 300,
  SHOW_MISMATCH_DURATION: 1000,
  MATCH_CELEBRATION_DURATION: 500,
};

export const LAYOUT = {
  CARD_SIZE: 100,
  CARD_GAP: 12,
  CARD_BORDER_RADIUS: 14,
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; columns: number; landscapeColumns: number }> = {
  easy: { pairs: 2, columns: 2, landscapeColumns: 4 },
  medium: { pairs: 3, columns: 3, landscapeColumns: 6 },
  hard: { pairs: 4, columns: 4, landscapeColumns: 4 },
  expert: { pairs: 9, columns: 3, landscapeColumns: 6 },
};

// Aligned to the design system green accent.
export const GAME_COLORS = {
  background: COLORS.canvas,
  cardFace: COLORS.surface,
  cardBack: ACCENTS.green.base,
  matched: ACCENTS.green.tint,
  matchedBorder: ACCENTS.green.deep,
};
