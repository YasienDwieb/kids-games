/**
 * Match Up — guided-flow adapter.
 *
 * Exposes the game's generated rounds to guided mode with no per-topic authoring:
 * each journey unit renders one round via the same MatchBoard the standalone game
 * uses, scoreless, calling onComplete when every pair is connected.
 */
import { StyleSheet, View } from 'react-native';
import { registerFlowAdapter } from '@/sdk';
import { MatchBoard } from './components/MatchBoard';
import { buildLevel } from './utils/levels';
import { TOTAL_LEVELS } from './constants';
import type { RoundData } from './types';

function MatchUpFlowRound({
  round,
  onComplete,
}: {
  round: RoundData;
  onComplete: () => void;
}) {
  return (
    <View style={styles.root}>
      <MatchBoard round={round} onSolved={onComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
});

registerFlowAdapter({
  gameId: 'match-up',
  count: TOTAL_LEVELS,
  unitAt: (i, seed) => {
    const round = buildLevel(i + 1, seed);
    return {
      key: `match-up-${i}`,
      // Key by unit so React remounts (and MatchBoard's per-round state resets)
      // even when consecutive units are the same game (single-game journeys).
      render: (onComplete) => (
        <MatchUpFlowRound key={`match-up-${i}`} round={round} onComplete={onComplete} />
      ),
    };
  },
});
