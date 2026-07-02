/**
 * Animal Safari — host screen (built on the shared listen-and-find engine).
 *
 * Uses the SAME two-panel ListenFindBoard as Letter Land / Numbers Land: a left
 * tappable hero picture (the target animal) with a 🔊 replay badge, and a right
 * column "Which animal…?" instruction over a row of chunky animal-image choice
 * tiles.
 *
 * Two round modes ALTERNATE by level (see constants/modeForLevel — odd levels
 * are hearName, even levels are whichSound):
 *   • hearName   — the animal NAME is spoken via useSpeech() (EN/AR, locale-
 *                  aware); the child taps the matching animal among 3 choices.
 *   • whichSound — the animal SOUND is played via useSound() (a real CC0 clip,
 *                  intent = the bare animal id); the child taps the animal that
 *                  makes it.
 *
 * The board's onReplay / the hook's speakTarget BOTH branch on the round mode:
 * hearName → speak the name; whichSound → play the sound. The hook fires
 * speakTarget on every level change, so it must present the correct cue.
 *
 * Choice tiles are animal IMAGES (ANIMAL_IMAGES require-map), passed to the
 * board as ImageFindItem { id, image } — the board renders the picture instead
 * of a glyph. Letters/numbers keep passing glyphs, unaffected.
 *
 * Flow (mirrors letter-land):
 *   loading   → loading view
 *   resumable → ResumePrompt (continue / start over)
 *   playing   → ListenFindBoard + score HUD via GameShell
 *
 * Determinism lives in the domain (level × 7919 seed, mulberry32) — no
 * Math.random / Date.now here.
 */

import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  ResumePrompt,
  SPACING,
  levelsFromGenerator,
  useSound,
  useSpeech,
  useTranslation,
  type LevelSource,
} from '@/sdk';
import {
  ListenFindBoard,
  useListenFind,
  type FindItem,
  type ListenFindLevel,
} from '@/games/_shared/listen-find';
import { LevelSolvedOverlay } from './components/LevelSolvedOverlay';
import { ANIMAL_IMAGES } from './animalImages';
import { buildRound } from './utils/generate';
import { LEVEL_COUNT } from './utils/levels';
import type { Animal, Round, RoundMode } from './types';

// ---------------------------------------------------------------------------
// Board level shape — the shared engine's ListenFindLevel enriched with the
// round mode + the target Animal, so speakTarget/onReplay can branch on mode
// and speak the localized name. Choices carry the animal image so the board's
// ImageFindItem path renders the picture tile.
// ---------------------------------------------------------------------------

type AnimalFindLevel = ListenFindLevel & {
  readonly round: ListenFindLevel['round'] & {
    readonly mode: RoundMode;
    readonly targetAnimal: Animal;
  };
};

/** Map one animal to an image-bearing choice tile. */
function toFindItem(animal: Animal): FindItem {
  return { id: animal.id, image: ANIMAL_IMAGES[animal.id] };
}

/** Adapt one Animal Safari `Round` into a board-ready round (images + target). */
function toFindRound(round: Round): AnimalFindLevel['round'] {
  return {
    choices: round.choices.map(toFindItem),
    correctIndex: round.correctIndex,
    target: toFindItem(round.target),
    mode: round.mode,
    targetAnimal: round.target,
  };
}

// Module-const source → stable identity. Re-generates via the domain's
// deterministic buildRound (level × 7919), then maps animals → board items.
const boardSource: LevelSource<AnimalFindLevel> = levelsFromGenerator(
  (level): AnimalFindLevel => ({ level, round: toFindRound(buildRound(level, level * 7919)) }),
  { count: LEVEL_COUNT },
);

export default function AnimalSafari(): React.JSX.Element {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const { play } = useSound();

  const source = useMemo(() => boardSource, []);

  // The hook fires speakTarget on level-change via its own ref (after render),
  // so reading the latest round from a ref avoids a hook ↔ present cycle.
  const roundRef = useRef<AnimalFindLevel['round'] | null>(null);

  // Present the active round's target — BRANCHES ON MODE:
  //   hearName   → speak the localized animal NAME.
  //   whichSound → play the animal's SFX (intent = bare animal id; each clip is
  //                tagged with the id, so play() resolves it by tag).
  const present = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    if (round.mode === 'hearName') {
      void speak(t('animal-safari:names.' + round.targetAnimal.id));
    } else {
      void play(round.targetAnimal.id);
    }
  }, [t, speak, play]);

  const lf = useListenFind<AnimalFindLevel>({
    gameId: 'animal-safari',
    source,
    speakTarget: present,
    renderSolved: (isLast, onNext) => <LevelSolvedOverlay isLast={isLast} onNext={onNext} />,
  });

  // Keep the latest round available to present().
  if (lf.status === 'playing') roundRef.current = lf.data.round;

  if (lf.status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{t('animal-safari:loading')}</Text>
      </View>
    );
  }

  if (lf.status === 'resumable') {
    return <ResumePrompt level={lf.level} onContinue={lf.start} onStartOver={lf.startOver} />;
  }

  const round = lf.data.round;
  const instruction =
    round.mode === 'hearName'
      ? t('animal-safari:hearName.which')
      : t('animal-safari:whichSound.which');

  return (
    <View style={styles.root}>
      <ListenFindBoard
        hero={<AnimalHero mode={round.mode} />}
        instruction={instruction}
        choices={round.choices}
        correctIndex={round.correctIndex}
        selectedIndex={lf.selectedIndex}
        onPick={(i) => lf.handlePick(i, round.correctIndex)}
        onReplay={present}
        disabled={lf.solved}
        accent="orange"
        choiceLabel={() => t('animal-safari:a11y.choiceTileGeneric')}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// AnimalHero — the NEUTRAL "listen" visual inside the board's hero surface.
//
// The target is presented AUDIBLY (spoken name / played sound), never shown —
// revealing the target animal here would give away the answer, since the choice
// tiles are animal pictures. So the hero is a mode-hinting prompt glyph only:
//   hearName   → 🗣️ (a voice says the name)
//   whichSound → 🎵 (a sound to identify)
// Emoji are authored DATA, rendered literally.
// ---------------------------------------------------------------------------

function AnimalHero({ mode }: { mode: RoundMode }): React.JSX.Element {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroGlyph}>{mode === 'hearName' ? '🗣️' : '🎵'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: 'center', justifyContent: 'center' },
  heroGlyph: { fontSize: 96, lineHeight: 110, textAlign: 'center' },
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
