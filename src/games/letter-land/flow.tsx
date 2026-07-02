/**
 * Letter Land — guided-flow adapter.
 *
 * Exposes the game's generated rounds to guided mode with no per-topic
 * authoring: each journey unit renders one listen-and-find round via the same
 * ListenFindBoard the standalone game uses, scoreless, calling onComplete on the
 * correct pick. Speaks the target on mount.
 */

import { useEffect } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { registerFlowAdapter, useFlowRound, useSpeech, useTranslation } from '@/sdk';
import { ListenFindBoard, buildRound, orderFor } from '@/games/_shared/listen-find';
import { LetterHero } from './components/LetterHero';
import { LATIN_LETTERS, ARABIC_LETTERS, CHOICES_PER_ROUND } from './constants';
import type { Letter } from './types';

function LetterFlowRound({
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

  const set = I18nManager.isRTL ? ARABIC_LETTERS : LATIN_LETTERS;
  const order = orderFor(set.length, seed);
  const round = buildRound(set, order, index + 1, (index + 1) * 7919, CHOICES_PER_ROUND);
  const target: Letter = round.target;

  const speakTarget = () => {
    const name = t('letter-land:names.' + target.id);
    const word = t('letter-land:words.' + target.word);
    void speak(t('letter-land:speak.carrier', { name, word }));
  };

  // Speak once on mount (each unit remounts via its key).
  useEffect(() => {
    speakTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      <ListenFindBoard
        hero={<LetterHero letter={target} />}
        instruction={t('letter-land:hearFind.which')}
        choices={round.choices}
        correctIndex={round.correctIndex}
        selectedIndex={selectedIndex}
        onPick={(i) => pick(i, round.correctIndex)}
        onReplay={speakTarget}
        disabled={solved}
        accent="blue"
        background="transparent"
        choiceLabel={(glyph) => t('letter-land:a11y.choiceTile', { glyph })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
});

registerFlowAdapter({
  gameId: 'letter-land',
  count: LATIN_LETTERS.length,
  unitAt: (i, seed) => ({
    key: `letter-land-${i}`,
    render: (onComplete) => (
      <LetterFlowRound key={`letter-land-${i}`} index={i} seed={seed} onComplete={onComplete} />
    ),
  }),
});
