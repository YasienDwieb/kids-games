/**
 * Letter Land — host screen.
 *
 * Listen & find: the target letter is spoken (name + example word) and the
 * child taps the matching letter. Built on the shared listen-and-find engine —
 * the standalone host logic lives in useListenFind; this screen wires the
 * letter inventory, the word-picture hero, and the spoken prompt.
 *
 * Flow:
 *   loading   → loading view (also while the order seed loads)
 *   resumable → ResumePrompt (continue / start over → reshuffle)
 *   playing   → ListenFindBoard + score HUD via GameShell
 *
 * Letter set switches by LANGUAGE: Arabic under RTL, Latin otherwise. The walk
 * order is a per-run shuffle from a persisted seed (random, not alphabetical);
 * Start Over reshuffles. Generation is deterministic (level × 7919); the only
 * Math.random is the order seed, kept in makeOrderSeed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
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
import { LetterHero } from './components/LetterHero';
import { LevelSolvedOverlay } from './components/LevelSolvedOverlay';
import { LATIN_LETTERS, ARABIC_LETTERS } from './constants';
import { makeLetterLandLevels } from './utils/levels';
import type { Letter } from './types';

export default function LetterLand(): React.JSX.Element {
  const { t } = useTranslation();
  const orderApi = useMemo(() => makeOrderSeed('letter-land'), []);
  const [seed, setSeed] = useState<number | null>(null);

  // Load the persisted order seed once (gates the playing host below).
  useEffect(() => {
    void orderApi.read().then(setSeed);
  }, [orderApi]);

  const reshuffle = useCallback(() => {
    void orderApi.reroll().then(setSeed);
  }, [orderApi]);

  if (seed == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{t('letter-land:loading')}</Text>
      </View>
    );
  }

  return <LetterLandRun seed={seed} onReshuffle={reshuffle} />;
}

// ---------------------------------------------------------------------------
// Playing host — mounted once the order seed is known.
// ---------------------------------------------------------------------------

function LetterLandRun({
  seed,
  onReshuffle,
}: {
  seed: number;
  onReshuffle: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { speak } = useSpeech();

  // Letter set by language: Arabic under RTL, Latin otherwise.
  const set = useMemo(() => (I18nManager.isRTL ? ARABIC_LETTERS : LATIN_LETTERS), []);
  const source = useMemo(() => makeLetterLandLevels(set, seed), [set, seed]);

  // The hook fires speakTarget on level-change via its own ref (after render),
  // so reading the latest target from a ref avoids a hook ↔ speak cycle.
  const targetRef = useRef<Letter | null>(null);
  const speakTarget = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;
    const name = t('letter-land:names.' + target.id);
    const word = t('letter-land:words.' + target.word);
    void speak(`${name}. ${word}`);
  }, [t, speak]);

  const lf = useListenFind({
    gameId: 'letter-land',
    source,
    speakTarget,
    renderSolved: (isLast, onNext) => <LevelSolvedOverlay isLast={isLast} onNext={onNext} />,
  });

  // Keep the latest target available to speakTarget.
  if (lf.status === 'playing') targetRef.current = lf.data.round.target;

  const handleStartOver = useCallback(() => {
    onReshuffle();
    lf.startOver();
  }, [onReshuffle, lf]);

  if (lf.status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{t('letter-land:loading')}</Text>
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
        hero={<LetterHero letter={round.target} />}
        instruction={t('letter-land:hearFind.which')}
        choices={round.choices}
        correctIndex={round.correctIndex}
        selectedIndex={lf.selectedIndex}
        onPick={(i) => lf.handlePick(i, round.correctIndex)}
        onReplay={speakTarget}
        disabled={lf.solved}
        accent="blue"
        choiceLabel={(glyph) => t('letter-land:a11y.choiceTile', { glyph })}
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
