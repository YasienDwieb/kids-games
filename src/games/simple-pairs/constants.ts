import type { Difficulty } from './types';

export const CARD_IMAGES = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🦁', '🐮', '🐵', '🦄', '🐧'];

export const TIMING = {
  FLIP_DURATION: 300,
  SHOW_MISMATCH_DURATION: 1000,
  MATCH_CELEBRATION_DURATION: 500,
};

export const LAYOUT = {
  CARD_SIZE: 100,
  CARD_GAP: 16,
  CARD_BORDER_RADIUS: 16,
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; columns: number }> = {
  easy: { pairs: 2, columns: 2 },
  medium: { pairs: 3, columns: 3 },
  hard: { pairs: 4, columns: 3 },
  expert: { pairs: 9, columns: 3 },
};

export const GAME_COLORS = {
  background: '#E8F5E9',
  cardFace: '#FFFFFF',
  cardBack: '#81C784',
  matched: '#C8E6C9',
};
