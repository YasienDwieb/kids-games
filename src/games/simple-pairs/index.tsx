import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DifficultySelect, GameBoard, GameHeader, MatchCelebration, WinScreen } from './components';
import { useSimplePairs } from './hooks';
import { useSound, useScreenBack } from '@/sdk';
import { DIFFICULTY_CONFIG, GAME_COLORS } from './constants';
import type { Difficulty } from './types';

// Fewer moves earn more stars (mirrors design starsFor).
function starsFor(moves: number, pairs: number): number {
  if (moves <= Math.ceil(pairs * 1.5)) return 3;
  if (moves <= pairs * 2 + 1) return 2;
  return 1;
}

function GameContent({ difficulty, onBack }: { difficulty: Difficulty; onBack: () => void }) {
  const { gameState, flipCard, resetGame } = useSimplePairs(difficulty);
  const { play } = useSound();
  const [showCelebration, setShowCelebration] = useState(false);
  const prevMatchedPairs = useRef(0);
  const prevMoves = useRef(0);

  useEffect(() => {
    if (gameState.matchedPairs > prevMatchedPairs.current) {
      play('success');
      if (gameState.isComplete) {
        play('win');
      } else {
        setShowCelebration(true);
      }
    } else if (gameState.moves > prevMoves.current && gameState.matchedPairs === prevMatchedPairs.current) {
      play('wrong');
    }
    prevMatchedPairs.current = gameState.matchedPairs;
    prevMoves.current = gameState.moves;
  }, [gameState.matchedPairs, gameState.moves, gameState.isComplete, play]);

  const handleCardPress = (cardId: string) => {
    play('pop');
    flipCard(cardId);
  };

  const handlePlayAgain = () => {
    prevMatchedPairs.current = 0;
    prevMoves.current = 0;
    resetGame();
  };

  const stars = starsFor(gameState.moves, gameState.totalPairs);

  return (
    <View style={styles.container}>
      <GameHeader
        found={gameState.matchedPairs}
        total={gameState.totalPairs}
        moves={gameState.moves}
        onReset={resetGame}
      />

      <GameBoard
        cards={gameState.cards}
        onCardPress={handleCardPress}
        disabled={gameState.isLocked}
        columns={DIFFICULTY_CONFIG[difficulty].columns}
      />

      <MatchCelebration
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      <WinScreen
        visible={gameState.isComplete}
        moves={gameState.moves}
        stars={stars}
        onPlayAgain={handlePlayAgain}
        onPickLevel={onBack}
      />
    </View>
  );
}

export default function SimplePairsGame() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  // Back from the board returns to the difficulty picker before exiting home.
  useScreenBack(() => {
    if (difficulty) {
      setDifficulty(null);
      return true;
    }
    return false;
  });

  if (!difficulty) {
    return <DifficultySelect onSelect={setDifficulty} />;
  }

  return <GameContent key={difficulty} difficulty={difficulty} onBack={() => setDifficulty(null)} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
});
