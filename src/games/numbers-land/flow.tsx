/**
 * Numbers Land — guided-flow adapter.
 *
 * Each journey unit renders one listen-and-find round via the same
 * ListenFindBoard the standalone game uses, scoreless, calling onComplete on the
 * correct pick. Speaks the target on mount.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { registerFlowAdapter, useFlowRound, useSpeech, useTranslation } from '@/sdk';
import { ListenFindBoard, buildRound, orderFor } from '@/games/_shared/listen-find';
import { NumberHero } from './components/NumberHero';
import { NUMBERS, CHOICES_PER_ROUND } from './constants';
import type { NumberItem } from './types';

function NumberFlowRound({
  index,
  seed,
  onComplete,
}: {
  index: number;
  seed: number;
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const { solved, selectedIndex, pick } = useFlowRound(onComplete);

  const order = orderFor(NUMBERS.length, seed);
  const round = buildRound(NUMBERS, order, index + 1, (index + 1) * 7919, CHOICES_PER_ROUND);
  const target: NumberItem = round.target;

  const speakTarget = () => {
    const name = t('numbers-land:names.' + target.id);
    void speak(t('numbers-land:speak.carrier', { name }));
  };

  useEffect(() => {
    speakTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      <ListenFindBoard
        hero={<NumberHero item={target} />}
        instruction={t('numbers-land:hearFind.which')}
        choices={round.choices}
        correctIndex={round.correctIndex}
        selectedIndex={selectedIndex}
        onPick={(i) => pick(i, round.correctIndex)}
        onReplay={speakTarget}
        disabled={solved}
        accent="orange"
        background="transparent"
        choiceLabel={(item) => t('numbers-land:a11y.choiceTile', { glyph: item.glyph ?? '' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
});

registerFlowAdapter({
  gameId: 'numbers-land',
  count: NUMBERS.length,
  unitAt: (i, seed) => ({
    key: `numbers-land-${i}`,
    render: (onComplete) => (
      <NumberFlowRound key={`numbers-land-${i}`} index={i} seed={seed} onComplete={onComplete} />
    ),
  }),
});
