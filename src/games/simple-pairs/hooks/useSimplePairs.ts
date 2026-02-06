import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, Difficulty, GameState } from '../types';
import { CARD_IMAGES, DIFFICULTY_CONFIG, TIMING } from '../constants';
import { shuffle } from '../utils';

function createCards(difficulty: Difficulty): Card[] {
  const { pairs } = DIFFICULTY_CONFIG[difficulty];
  const selected = shuffle(CARD_IMAGES).slice(0, pairs);

  const cards: Card[] = selected.flatMap((image, i) => [
    { id: `card-${i * 2}`, pairId: `pair-${i}`, image, isFlipped: false, isMatched: false },
    { id: `card-${i * 2 + 1}`, pairId: `pair-${i}`, image, isFlipped: false, isMatched: false },
  ]);

  return shuffle(cards);
}

function createInitialState(difficulty: Difficulty): GameState {
  const { pairs } = DIFFICULTY_CONFIG[difficulty];
  return {
    cards: createCards(difficulty),
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: pairs,
    moves: 0,
    isComplete: false,
    isLocked: false,
  };
}

export function useSimplePairs(difficulty: Difficulty = 'easy') {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(difficulty));
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const addTimer = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, delay);
    timers.current.add(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => clearAllTimers, [clearAllTimers]);

  const flipBack = useCallback(() => {
    setGameState((prev) => {
      if (prev.flippedCards.length === 0) return prev;
      const cards = prev.cards.map((c) =>
        prev.flippedCards.includes(c.id) ? { ...c, isFlipped: false } : c,
      );
      return { ...prev, cards, flippedCards: [], isLocked: false };
    });
  }, []);

  const resolveMatch = useCallback(() => {
    setGameState((prev) => {
      if (prev.flippedCards.length !== 2) return prev;

      const [firstId, secondId] = prev.flippedCards;
      const first = prev.cards.find((c) => c.id === firstId);
      const second = prev.cards.find((c) => c.id === secondId);
      if (!first || !second) return prev;

      const isMatch = first.pairId === second.pairId;

      if (isMatch) {
        const cards = prev.cards.map((c) =>
          c.id === firstId || c.id === secondId
            ? { ...c, isMatched: true, isFlipped: false }
            : c,
        );
        const matchedPairs = prev.matchedPairs + 1;
        return {
          ...prev,
          cards,
          flippedCards: [],
          matchedPairs,
          moves: prev.moves + 1,
          isComplete: matchedPairs === prev.totalPairs,
          isLocked: false,
        };
      }

      // Mismatch — keep locked, schedule flip-back
      addTimer(flipBack, TIMING.SHOW_MISMATCH_DURATION);
      return { ...prev, moves: prev.moves + 1 };
    });
  }, [flipBack, addTimer]);

  // Watch for 2 flipped cards → schedule match resolution after flip animation
  useEffect(() => {
    if (gameState.flippedCards.length === 2) {
      addTimer(resolveMatch, TIMING.FLIP_DURATION);
    }
  }, [gameState.flippedCards, addTimer, resolveMatch]);

  const flipCard = useCallback((cardId: string) => {
    setGameState((prev) => {
      if (prev.isLocked) return prev;

      const card = prev.cards.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return prev;
      if (prev.flippedCards.length >= 2) return prev;

      const cards = prev.cards.map((c) =>
        c.id === cardId ? { ...c, isFlipped: true } : c,
      );
      const flippedCards = [...prev.flippedCards, cardId];
      const isSecondFlip = flippedCards.length === 2;

      return {
        ...prev,
        cards,
        flippedCards,
        isLocked: isSecondFlip,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setGameState(createInitialState(difficulty));
  }, [difficulty, clearAllTimers]);

  return { gameState, flipCard, resetGame };
}
