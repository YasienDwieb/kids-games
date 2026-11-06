import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { DifficultySelect, GameBoard, GameHeader, MatchCelebration } from './components';
import { useSimplePairs } from './hooks';
import { awardStars, useRoundEnd, useSound, useScreenBack } from '@/sdk';
import { DIFFICULTY_CONFIG, GAME_COLORS } from './constants';
import type { Difficulty } from './types';

function GameContent({
  difficulty,
}: {
  difficulty: Difficulty;
}) {
  const { gameState, flipCard, resetGame } = useSimplePairs(difficulty);
  const roundEnd = useRoundEnd();
  const { play } = useSound();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [showCelebration, setShowCelebration] = useState(false);
  const prevMatchedPairs = useRef(0);
  const prevMoves = useRef(0);

  useEffect(() => {
    if (gameState.matchedPairs > prevMatchedPairs.current) {
      play('success');
      if (gameState.isComplete) {
        play('win');
        void awardStars('simple-pairs');
        // A fresh deal at the same level; back returns to the picker.
        void roundEnd.next('big', () => {
          prevMatchedPairs.current = 0;
          prevMoves.current = 0;
          resetGame();
        });
      } else {
        setShowCelebration(true);
      }
    } else if (gameState.moves > prevMoves.current && gameState.matchedPairs === prevMatchedPairs.current) {
      play('wrong');
    }
    prevMatchedPairs.current = gameState.matchedPairs;
    prevMoves.current = gameState.moves;
  }, [gameState.matchedPairs, gameState.moves, gameState.isComplete, play, roundEnd, resetGame]);

  const handleCardPress = (cardId: string) => {
    play('pop');
    flipCard(cardId);
  };

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
        columns={landscape ? DIFFICULTY_CONFIG[difficulty].landscapeColumns : DIFFICULTY_CONFIG[difficulty].columns}
      />

      <MatchCelebration
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
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

  return (
    <GameContent key={difficulty} difficulty={difficulty} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
});
