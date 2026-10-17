/**
 * Trace It — guided-flow adapter.
 *
 * Three units: a warm-up, then the next two untraced letters in school order
 * (guided pass only), each on the same Round the standalone game uses.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { registerFlowAdapter, useFlowRound } from '@/sdk';
import { charsFor, currentScript, flowLetter, type TraceChar } from './catalog';
import { Round } from './components/Round';
import { WARMUPS } from './glyphs/warmup';
import { progressStore } from './progress';

function FlowRound({ char, onComplete }: { char: TraceChar; onComplete: () => void }) {
  const { complete } = useFlowRound(onComplete);
  return (
    <View style={styles.root}>
      <Round char={char} mode="guidedOnly" inFlow onFinished={complete} />
    </View>
  );
}

function LetterUnit({ nth, onComplete }: { nth: 0 | 1; onComplete: () => void }) {
  const [char, setChar] = useState<TraceChar | null>(null);
  useEffect(() => {
    let alive = true;
    void progressStore.get().then(({ done }) => {
      if (!alive) return;
      setChar(flowLetter(charsFor('letters', currentScript()), done, nth));
    });
    return () => {
      alive = false;
    };
  }, [nth]);
  return char ? <FlowRound char={char} onComplete={onComplete} /> : null;
}

function WarmupUnit({ seed, onComplete }: { seed: number; onComplete: () => void }) {
  const warmups = charsFor('warmup', currentScript());
  return <FlowRound char={warmups[seed % WARMUPS.length]} onComplete={onComplete} />;
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through.
  root: { flex: 1 },
});

registerFlowAdapter({
  gameId: 'trace-it',
  count: 3,
  unitAt: (i, seed) => ({
    key: `trace-it-${i}`,
    render: (onComplete) =>
      i === 0 ? (
        <WarmupUnit key="trace-it-0" seed={Math.abs(seed)} onComplete={onComplete} />
      ) : (
        <LetterUnit key={`trace-it-${i}`} nth={i === 1 ? 0 : 1} onComplete={onComplete} />
      ),
  }),
});
