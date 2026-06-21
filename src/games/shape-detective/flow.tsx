/**
 * Shape Detective — guided-flow adapter.
 *
 * Exposes the game's existing generated puzzles to guided mode with no
 * per-topic authoring: each journey unit renders one puzzle via the same
 * puzzle components the game uses, scoreless, calling onComplete on solve.
 */
import { StyleSheet, View } from 'react-native';
import { registerFlowAdapter, useFlowRound } from '@/sdk';
import { OddOneOutPuzzle } from './components/OddOneOutPuzzle';
import { PatternPuzzle } from './components/PatternPuzzle';
import { SortPuzzle } from './components/SortPuzzle';
import { buildLevel, TOTAL_LEVELS } from './utils/levels';
import type { LevelData } from './types';

function ShapeDetectiveFlowRound({
  level,
  onComplete,
}: {
  level: LevelData;
  onComplete: () => void;
}) {
  const { play, solved, selectedIndex, complete, pick } = useFlowRound(onComplete);
  const { puzzle } = level;

  if (puzzle.type === 'sort') {
    return (
      <View style={styles.root}>
        <SortPuzzle
          puzzle={puzzle}
          onDrop={(itemIndex, binIndex) => {
            if (binIndex === -1) return void play('wrong');
            void play(binIndex === puzzle.assignments[itemIndex] ? 'success' : 'wrong');
          }}
          onSolved={complete}
        />
      </View>
    );
  }

  if (puzzle.type === 'oddOneOut') {
    return (
      <View style={styles.root}>
        <OddOneOutPuzzle
          puzzle={puzzle}
          selectedIndex={selectedIndex}
          onPick={(i) => pick(i, puzzle.correctIndex)}
          disabled={selectedIndex !== null || solved}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <PatternPuzzle
        puzzle={puzzle}
        selectedIndex={selectedIndex}
        onPick={(i) => pick(i, puzzle.correctIndex)}
        disabled={selectedIndex !== null || solved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
});

registerFlowAdapter({
  gameId: 'shape-detective',
  count: TOTAL_LEVELS,
  unitAt: (i) => {
    const level = buildLevel(i + 1);
    return {
      key: `shape-detective-${i}`,
      render: (onComplete) => <ShapeDetectiveFlowRound level={level} onComplete={onComplete} />,
    };
  },
});
