/**
 * Numbers Land — host screen.
 *
 * Listen & find: the target number is spoken and the child taps the matching
 * digit. Audio-first sibling to Letter Land (count-and-pop is the visual
 * counting game). Built on the shared listen-and-find engine — standalone host
 * logic lives in useListenFind; this screen wires the number inventory, the
 * count-cluster hero, and the spoken prompt.
 *
 * The walk order is a per-run shuffle from a persisted seed (random, not 1→10);
 * Start Over reshuffles. Generation is deterministic (level × 7919); the only
 * Math.random is the order seed, kept in makeOrderSeed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  ResumePrompt,
  SPACING,
  useSpeech,
  useTranslation,
} from '@/sdk';
import { ListenFindBoard, useListenFind, makeOrderSeed } from '@/games/_shared/listen-find';
import { NumberHero } from './components/NumberHero';
import { LevelSolvedOverlay } from './components/LevelSolvedOverlay';
import { makeNumbersLandLevels } from './utils/levels';
import type { NumberItem } from './types';

export default function NumbersLand(): React.JSX.Element {
  const { t } = useTranslation();
  const orderApi = useMemo(() => makeOrderSeed('numbers-land'), []);
  const [seed, setSeed] = useState<number | null>(null);

  useEffect(() => {
    void orderApi.read().then(setSeed);
  }, [orderApi]);

  const reshuffle = useCallback(() => {
    void orderApi.reroll().then(setSeed);
  }, [orderApi]);

  if (seed == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{t('numbers-land:loading')}</Text>
      </View>
    );
  }

  return <NumbersLandRun seed={seed} onReshuffle={reshuffle} />;
}

function NumbersLandRun({
  seed,
  onReshuffle,
}: {
  seed: number;
  onReshuffle: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { speak } = useSpeech();

  const source = useMemo(() => makeNumbersLandLevels(seed), [seed]);

  const targetRef = useRef<NumberItem | null>(null);
  const speakTarget = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;
    const name = t('numbers-land:names.' + target.id);
    void speak(t('numbers-land:speak.carrier', { name }));
  }, [t, speak]);

  const lf = useListenFind({
    gameId: 'numbers-land',
    source,
    speakTarget,
    renderSolved: (isLast, onNext) => <LevelSolvedOverlay isLast={isLast} onNext={onNext} />,
  });

  if (lf.status === 'playing') targetRef.current = lf.data.round.target;

  const handleStartOver = useCallback(() => {
    onReshuffle();
    lf.startOver();
  }, [onReshuffle, lf]);

  if (lf.status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{t('numbers-land:loading')}</Text>
      </View>
    );
  }

  if (lf.status === 'resumable') {
    return <ResumePrompt level={lf.level} onContinue={lf.start} onStartOver={handleStartOver} />;
  }

  const round = lf.data.round;

  return (
    <View style={styles.root}>
      <ListenFindBoard
        hero={<NumberHero item={round.target} />}
        instruction={t('numbers-land:hearFind.which')}
        choices={round.choices}
        correctIndex={round.correctIndex}
        selectedIndex={lf.selectedIndex}
        onPick={(i) => lf.handlePick(i, round.correctIndex)}
        onReplay={speakTarget}
        disabled={lf.solved}
        accent="orange"
        choiceLabel={(glyph) => t('numbers-land:a11y.choiceTile', { glyph })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loading: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
});
