export type Card = {
  id: string;
  pairId: string;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export type GameState = {
  cards: Card[];
  flippedCards: string[];
  matchedPairs: number;
  totalPairs: number;
  moves: number;
  isComplete: boolean;
  isLocked: boolean;
};

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
