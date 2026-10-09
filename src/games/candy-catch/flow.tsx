/**
 * Candy Catch — guided-flow adapter.
 *
 * A short, gentle "brain break" between quiz steps: the same CatchField as the
 * standalone game, slow and with no hearts to lose, completing once a small
 * point target is caught.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HudPill, hudTextStyle, registerFlowAdapter, useFlowRound } from '@/sdk';
import { CatchField } from './components/CatchField';
import type { LevelSpec } from './constants';

// Gentler than standalone level 1: fewer yucky items, a bit more gold, small targets.
const ROUNDS: LevelSpec[] = [25, 30, 35, 40].map((target) => ({
  target,
  spawnInterval: 950,
  fallSpeed: 140,
  hazardChance: 0.05,
  goldChance: 0.1,
}));

function CatchFlowRound({ data, onComplete }: { data: LevelSpec; onComplete: () => void }) {
  const { complete, solved } = useFlowRound(onComplete);
  const [score, setScore] = useState(0);

  return (
    <View style={styles.root}>
      <CatchField
        data={data}
        active={!solved}
        maxLives={null}
        onScore={setScore}
        onWin={complete}
      />
      <View style={styles.hud} pointerEvents="none">
        <HudPill>
          {/* Pinned LTR so "12 / 25" never reorders under RTL. */}
          <Text style={[hudTextStyle, styles.ltr]}>
            🍬 {Math.min(score, data.target)} / {data.target}
          </Text>
        </HudPill>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
  hud: { position: 'absolute', top: 0, end: 0 },
  ltr: { writingDirection: 'ltr' },
});

registerFlowAdapter({
  gameId: 'candy-catch',
  count: ROUNDS.length,
  unitAt: (i) => ({
    key: `candy-catch-${i}`,
    render: (onComplete) => (
      <CatchFlowRound key={`candy-catch-${i}`} data={ROUNDS[i]} onComplete={onComplete} />
    ),
  }),
});
