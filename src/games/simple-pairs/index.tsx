import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DifficultySelect, GameBoard, GameHeader, MatchCelebration, WinScreen } from './components';
import { useGameSounds, useSimplePairs } from './hooks';
import { DIFFICULTY_CONFIG, GAME_COLORS } from './constants';
import type { Difficulty } from './types';

function GameContent({ difficulty, onBack }: { difficulty: Difficulty; onBack: () => void }) {
  const { gameState, flipCard, resetGame } = useSimplePairs(difficulty);
  const { playFlip, playMatch, playMismatch, playWin } = useGameSounds();
  const [showCelebration, setShowCelebration] = useState(false);
  const prevMatchedPairs = useRef(0);
  const prevMoves = useRef(0);

  useEffect(() => {
    if (gameState.matchedPairs > prevMatchedPairs.current) {
      playMatch();
      if (gameState.isComplete) {
        playWin();
      } else {
        setShowCelebration(true);
      }
    } else if (gameState.moves > prevMoves.current && gameState.matchedPairs === prevMatchedPairs.current) {
      playMismatch();
    }
    prevMatchedPairs.current = gameState.matchedPairs;
    prevMoves.current = gameState.moves;
  }, [gameState.matchedPairs, gameState.moves, gameState.isComplete, playMatch, playMismatch, playWin]);

  const handleCardPress = (cardId: string) => {
    playFlip();
    flipCard(cardId);
  };

  const handlePlayAgain = () => {
    prevMatchedPairs.current = 0;
    prevMoves.current = 0;
    resetGame();
  };

  return (
    <View style={styles.container}>
      <GameHeader onReset={resetGame} />

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
        onPlayAgain={handlePlayAgain}
      />
    </View>
  );
}

export default function SimplePairsGame() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

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
