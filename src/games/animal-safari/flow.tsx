/**
 * Animal Safari — guided-flow adapter.
 *
 * Exposes the game's generated rounds to guided mode via the SAME shared
 * ListenFindBoard the standalone game uses (scoreless), calling onComplete on
 * the correct pick.
 *
 * Each round has a TARGET presented AUDIBLY on mount — branching on mode:
 *   • hearName   — speak the localized animal NAME via useSpeech().
 *   • whichSound — play the animal's SFX via useSound() (intent = bare id).
 * A present-on-mount effect fires once per unit (the flow keys + remounts each
 * unit), mirroring the host screen's present-on-level-change. The tap
 * correct/wrong + success cue + advance is delegated to useFlowRound.
 *
 * The hero is a neutral mode-hinting glyph (never the target animal), since the
 * choice tiles are animal pictures — showing the target would give it away.
 */

import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  registerFlowAdapter,
  useFlowRound,
  useSound,
  useSpeech,
  useTranslation,
} from '@/sdk';
import { ListenFindBoard, type FindItem } from '@/games/_shared/listen-find';
import { ANIMAL_IMAGES } from './animalImages';
import { buildRound } from './utils/generate';
import { LEVEL_COUNT } from './utils/levels';
import type { Animal, Round } from './types';

function toFindItem(animal: Animal): FindItem {
  return { id: animal.id, image: ANIMAL_IMAGES[animal.id] };
}

function AnimalSafariFlowRound({
  round,
  onComplete,
}: {
  round: Round;
  onComplete: () => void;
}) {
  const { solved, selectedIndex, pick } = useFlowRound(onComplete);
  const { speak } = useSpeech();
  const { play } = useSound();
  const { t } = useTranslation();

  // Present the target once on mount — BRANCHES ON MODE: speak the NAME
  // (hearName) or play the SFX (whichSound; intent = bare animal id). Run once
  // per unit — the flow remounts each unit.
  const present = () => {
    if (round.mode === 'hearName') {
      void speak(t('animal-safari:names.' + round.target.id));
    } else {
      void play(round.target.id);
    }
  };
  const presentRef = useRef(present);
  presentRef.current = present;
  useEffect(() => {
    presentRef.current();
  }, []);

  const instruction =
    round.mode === 'hearName'
      ? t('animal-safari:hearName.which')
      : t('animal-safari:whichSound.which');

  return (
    <View style={styles.root}>
      <ListenFindBoard
        hero={
          <Text style={styles.heroGlyph}>{round.mode === 'hearName' ? '🗣️' : '🎵'}</Text>
        }
        instruction={instruction}
        choices={round.choices.map(toFindItem)}
        correctIndex={round.correctIndex}
        selectedIndex={selectedIndex}
        onPick={(i) => pick(i, round.correctIndex)}
        onReplay={() => presentRef.current()}
        disabled={solved}
        accent="orange"
        background="transparent"
        choiceLabel={() => t('animal-safari:a11y.choiceTileGeneric')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
  heroGlyph: { fontSize: 96, lineHeight: 110, textAlign: 'center' },
});

registerFlowAdapter({
  gameId: 'animal-safari',
  count: LEVEL_COUNT,
  unitAt: (i, seed) => {
    // The host walks 1-based levels seeded by `level * 7919`; mirror that here
    // so guided rounds match the standalone game's mode-by-parity + content.
    const level = i + 1;
    const round = buildRound(level, level * 7919);
    return {
      key: `animal-safari-${i}`,
      // Key by unit so React remounts (and per-round state + the present-on-
      // mount effect reset) even for consecutive same-game units.
      render: (onComplete) => (
        <AnimalSafariFlowRound
          key={`animal-safari-${i}`}
          round={round}
          onComplete={onComplete}
        />
      ),
    };
  },
});
