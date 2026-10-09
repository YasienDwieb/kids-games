/**
 * Simple Pairs — guided-flow adapter.
 *
 * Each journey unit is one small memory board (2–4 pairs) on the same GameBoard
 * the standalone game uses, scoreless, completing when every pair is found.
 */
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { registerFlowAdapter, useFlowRound } from '@/sdk';
import { GameBoard } from './components/GameBoard';
import { useSimplePairs } from './hooks/useSimplePairs';
import { DIFFICULTY_CONFIG } from './constants';
import type { Difficulty } from './types';

// Small boards only — a journey step should take well under a minute.
const LADDER: Difficulty[] = ['easy', 'medium', 'easy', 'medium', 'hard', 'medium'];

function PairsFlowRound({ difficulty, onComplete }: { difficulty: Difficulty; onComplete: () => void }) {
  const { gameState, flipCard } = useSimplePairs(difficulty);
  const { play, complete } = useFlowRound(onComplete);
  const prevMatched = useRef(0);
  const prevMoves = useRef(0);

  useEffect(() => {
    if (gameState.isComplete) {
      complete();
    } else if (gameState.matchedPairs > prevMatched.current) {
      void play('success');
    } else if (gameState.moves > prevMoves.current) {
      void play('wrong');
    }
    prevMatched.current = gameState.matchedPairs;
    prevMoves.current = gameState.moves;
  }, [gameState.matchedPairs, gameState.moves, gameState.isComplete, play, complete]);

  return (
    <View style={styles.root}>
      <GameBoard
        cards={gameState.cards}
        onCardPress={(id) => {
          void play('pop');
          flipCard(id);
        }}
        disabled={gameState.isLocked || gameState.isComplete}
        columns={DIFFICULTY_CONFIG[difficulty].landscapeColumns}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1, justifyContent: 'center' },
});

registerFlowAdapter({
  gameId: 'simple-pairs',
  count: LADDER.length,
  unitAt: (i) => ({
    key: `simple-pairs-${i}`,
    render: (onComplete) => (
      <PairsFlowRound key={`simple-pairs-${i}`} difficulty={LADDER[i]} onComplete={onComplete} />
    ),
  }),
});
