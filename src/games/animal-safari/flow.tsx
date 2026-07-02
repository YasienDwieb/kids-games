/**
 * Animal Safari — guided-flow adapter.
 *
 * Exposes the game's existing generated rounds to guided mode with no per-topic
 * authoring: each journey unit renders one round via the same HearName /
 * WhichSound components the standalone game uses, scoreless, calling onComplete
 * on solve.
 *
 * Unlike the visual-only puzzle games (shape-detective/match-up), each round
 * has a TARGET that must be PRESENTED audibly on mount:
 *   • hearName   — speak the localized animal NAME via useSpeech().
 *   • whichSound — play the animal's SFX via useSound() (intent = bare id).
 * A present-on-mount effect fires once per unit (the flow keys + remounts each
 * unit), mirroring the host screen's [level]-change presentation. The tap
 * correct/wrong + success cue + advance is delegated to useFlowRound.
 */
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  registerFlowAdapter,
  useFlowRound,
  useSpeech,
  useTranslation,
} from '@/sdk';
import { HearName } from './components/HearName';
import { WhichSound } from './components/WhichSound';
import { buildRound } from './utils/generate';
import { LEVEL_COUNT } from './utils/levels';
import type { Round } from './types';

function AnimalSafariFlowRound({
  round,
  onComplete,
}: {
  round: Round;
  onComplete: () => void;
}) {
  const { play, solved, selectedIndex, pick } = useFlowRound(onComplete);
  const { speak } = useSpeech();
  const { t } = useTranslation();

  // Present the target once on mount: speak the NAME (hearName) or play the
  // SFX (whichSound). The intent for play() is the bare animal id (its clip is
  // tagged with the id). Run once per unit — the flow remounts each unit.
  const presentTarget = () => {
    if (round.mode === 'hearName') {
      void speak(t('animal-safari:names.' + round.target.id));
    } else {
      void play(round.target.id);
    }
  };
  const presentRef = useRef(presentTarget);
  presentRef.current = presentTarget;
  useEffect(() => {
    presentRef.current();
  }, []);

  const disabled = selectedIndex !== null || solved;

  return (
    <View style={styles.root}>
      {round.mode === 'hearName' ? (
        <HearName
          round={round}
          onReplay={() => presentRef.current()}
          onPick={(i) => pick(i, round.correctIndex)}
          selectedIndex={selectedIndex}
          disabled={disabled}
        />
      ) : (
        <WhichSound
          round={round}
          onReplay={() => presentRef.current()}
          onPick={(i) => pick(i, round.correctIndex)}
          selectedIndex={selectedIndex}
          disabled={disabled}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1 },
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
