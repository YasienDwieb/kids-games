/**
 * Color Mixer — guided-flow adapter.
 *
 * Each journey unit is one target color from the challenge list: tap paint
 * blobs to add them to the pot (same pigment engine as the full game) and the
 * unit completes as soon as the mix is close enough (2★). Tap-to-add instead of
 * drag keeps it quick for a journey step; the target is spoken for pre-readers.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  COLORS as TOKENS,
  FONTS,
  IconButton,
  SPACING,
  registerFlowAdapter,
  useFlowRound,
  useSpeech,
  useTranslation,
} from '@/sdk';
import { ColorBlob } from './components/ColorBlob';
import { CHALLENGES, COLORS } from './constants';
import { MIX_CAP, PIGMENT_IDS, addDrop, isChallengeMet, mixHex, removeDrop } from './utils';
import type { ColorId, PigmentId } from './types';

const POT = 120;
const PAINT = 54;

function MixFlowRound({ target, onComplete }: { target: ColorId; onComplete: () => void }) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const { play, solved, complete } = useFlowRound(onComplete);
  const [log, setLog] = useState<PigmentId[]>([]);
  const hex = useMemo(() => mixHex(log), [log]);
  const targetHex = COLORS[target].hex;
  const targetName = t(`color-mixer:colors.${target}`);

  const sayTarget = () => void speak(`${t('color-mixer:challenge.makeThisColor')} ${targetName}`);
  // Say the goal once when the unit appears (each unit remounts via its key).
  useEffect(() => {
    sayTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!solved && isChallengeMet(hex, targetHex)) complete();
  }, [hex, targetHex, solved, complete]);

  const addPaint = (id: PigmentId) => {
    if (solved) return;
    if (log.length >= MIX_CAP) {
      void play('wrong');
      return;
    }
    void play('balloon');
    setLog((l) => addDrop(l, id));
  };

  return (
    <View style={styles.root}>
      <View style={styles.col}>
        <Text style={styles.prompt}>{t('color-mixer:challenge.makeThisColor')}</Text>
        <ColorBlob color={targetHex} size={96} pulsing onPress={sayTarget} />
        <Text style={styles.name}>{targetName}</Text>
      </View>

      <View style={styles.col}>
        <View style={styles.pot}>{hex ? <ColorBlob color={hex} size={POT - 16} /> : null}</View>
        <IconButton
          glyph="↩️"
          onPress={() => setLog((l) => removeDrop(l))}
          accessibilityLabel={t('color-mixer:actions.undo')}
          disabled={log.length === 0 || solved}
        />
      </View>

      <View style={styles.palette}>
        {PIGMENT_IDS.map((id) => (
          // No text label under each blob: three rows have to fit a landscape
          // phone's height. The name is still announced to screen readers.
          <ColorBlob
            key={id}
            color={COLORS[id].hex}
            size={PAINT}
            onPress={() => addPaint(id)}
            accessibilityLabel={t(`color-mixer:colors.${id}`)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent so the flow's shared backdrop shows through (continuous world).
  root: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  col: { alignItems: 'center', gap: SPACING.sm },
  prompt: { fontFamily: FONTS.display, fontSize: 18, color: TOKENS.ink },
  name: { fontFamily: FONTS.displayBold, fontSize: 22, color: TOKENS.ink },
  pot: {
    width: POT,
    height: POT,
    borderRadius: POT / 2,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: TOKENS.line2,
    backgroundColor: TOKENS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  palette: {
    width: (PAINT + SPACING.md) * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
  },
});

registerFlowAdapter({
  gameId: 'color-mixer',
  count: CHALLENGES.length,
  unitAt: (i) => ({
    key: `color-mixer-${i}`,
    render: (onComplete) => (
      <MixFlowRound key={`color-mixer-${i}`} target={CHALLENGES[i].targetColor} onComplete={onComplete} />
    ),
  }),
});
