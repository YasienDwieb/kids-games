/**
 * Mouse Maze — guided-flow adapter.
 *
 * Each journey unit is one small maze (5×5 or 6×6) on the same MazeView the
 * standalone game uses; it completes when the mouse reaches the cheese. If the
 * child stalls, the demo hand traces the next few cells.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { registerFlowAdapter, useFlowRound, useIdle } from '@/sdk';
import { MazeView } from './components/MazeView';
import { buildLevel, useMaze, type MazeState } from './hooks/useMaze';
import { FRAME_PAD } from './constants';

// Sizes stay small: a journey step, not a marathon. Level 1 = 5×5, 2 = 6×6.
const LADDER = [1, 1, 2, 1, 2, 2];
const IDLE_HINT_MS = 7000;

function MazeFlowRound({ initial, onComplete }: { initial: MazeState; onComplete: () => void }) {
  const maze = useMaze(initial);
  const { complete, solved } = useFlowRound(onComplete);
  const { idle, poke } = useIdle(IDLE_HINT_MS, !solved);
  const [area, setArea] = useState({ width: 0, height: 0 });

  const cellSize = useMemo(() => {
    if (!area.width || !area.height) return 0;
    return Math.floor((Math.min(area.width, area.height) * 0.92 - FRAME_PAD * 2 - 8) / maze.state.cols);
  }, [area, maze.state.cols]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      <MazeView
        maze={maze}
        cellSize={cellSize}
        showDemo={idle}
        onStep={(res) => {
          poke();
          if (res.reachedGoal) complete();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

registerFlowAdapter({
  gameId: 'mouse-maze',
  count: LADDER.length,
  unitAt: (i) => {
    const initial = buildLevel(LADDER[i]);
    return {
      key: `mouse-maze-${i}`,
      render: (onComplete) => (
        <MazeFlowRound key={`mouse-maze-${i}`} initial={initial} onComplete={onComplete} />
      ),
    };
  },
});
