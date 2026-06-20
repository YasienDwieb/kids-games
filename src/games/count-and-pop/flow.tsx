/**
 * Count & Pop — guided-flow adapter.
 *
 * Exposes the game's existing generated content (its rounds) to guided mode
 * with no per-topic authoring: each journey unit renders one round via the
 * same round components the game uses, scoreless, calling onComplete on solve.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { registerFlowAdapter, useSound } from '@/sdk';
import { CountThisMany } from './components/CountThisMany';
import { HowMany } from './components/HowMany';
import { buildLevel, TOTAL_LEVELS } from './utils/levels';
import type { LevelData } from './types';

function CountAndPopFlowRound({
  level,
  onComplete,
}: {
  level: LevelData;
  onComplete: () => void;
}) {
  const { play } = useSound();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const complete = useCallback(() => {
    if (solved) return;
    setSolved(true);
    void play('success');
    timer.current = setTimeout(onComplete, 450);
  }, [solved, play, onComplete]);

  const { round } = level;

  if (round.mode === 'countThisMany') {
    return (
      <View style={styles.root}>
        <CountThisMany
          round={round}
          onPop={() => void play('pop')}
          onSolved={complete}
          disabled={solved}
        />
      </View>
    );
  }

  const onPick = (idx: number) => {
    if (selectedIndex !== null || solved) return;
    setSelectedIndex(idx);
    if (idx === round.correctIndex) {
      complete();
    } else {
      void play('wrong');
      timer.current = setTimeout(() => setSelectedIndex(null), 900);
    }
  };

  return (
    <View style={styles.root}>
      <HowMany round={round} selectedIndex={selectedIndex} onPick={onPick} disabled={solved} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
});

registerFlowAdapter({
  gameId: 'count-and-pop',
  count: TOTAL_LEVELS,
  unitAt: (i, seed) => {
    const level = buildLevel(i + 1, seed);
    return {
      key: `count-and-pop-${i}`,
      render: (onComplete) => <CountAndPopFlowRound level={level} onComplete={onComplete} />,
    };
  },
});
