import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  FONTS, FONT_SIZES, COLORS,
  makeActor, rowLayout, useSound, useTranslation,
  type Actor, type FlowUnit, type FlowUnitContext, type FlowUnitProps,
} from '@/sdk';
import { buildOddOneOutPuzzle } from '@/games/shape-detective/utils/generate';
import { StarSprite } from './StarSprite';

export const FOUR_SHAPES_PUZZLE_SEED = 7;
const STAR_SIZE = 72;
const HIT = 88;
const ITEM_COUNT = 4;

/** One deterministic 4-item odd-one-out puzzle, shared by actors + Component. */
export function buildFourPuzzle() {
  return buildOddOneOutPuzzle(FOUR_SHAPES_PUZZLE_SEED, ['color'], ITEM_COUNT);
}

export function fourShapesActors(ctx: FlowUnitContext): Actor[] {
  const puzzle = buildFourPuzzle();
  const pts = rowLayout(ITEM_COUNT, {
    cx: ctx.width / 2,
    cy: ctx.height * 0.5,
    gap: STAR_SIZE + 32,
  });
  return pts.map((p, i) =>
    makeActor({
      id: `star-${i}`,
      x: p.x,
      y: p.y,
      content: <StarSprite color={puzzle.items[i].color} size={STAR_SIZE} />,
    }),
  );
}

function FourShapesComponent({ actors, onComplete }: FlowUnitProps) {
  const { play } = useSound();
  const { t } = useTranslation();
  const [solved, setSolved] = useState(false);
  const puzzle = buildFourPuzzle();

  const handleTap = (index: number) => {
    if (solved) return;
    if (index === puzzle.correctIndex) {
      setSolved(true);
      void play('success');
      setTimeout(onComplete, 450);
    } else {
      void play('wrong');
    }
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Text style={styles.prompt}>{t('flow.fourShapes.prompt')}</Text>
      {actors.map((a, i) => (
        <Pressable
          key={a.id}
          onPress={() => handleTap(i)}
          accessibilityLabel={t('flow.fourShapes.starLabel')}
          style={[styles.hit, { left: a.x - HIT / 2, top: a.y - HIT / 2 }]}
        />
      ))}
    </View>
  );
}

export const fourShapes: FlowUnit = {
  id: 'four-shapes',
  topicId: 'four',
  enterActors: fourShapesActors,
  exitActors: fourShapesActors,
  Component: FourShapesComponent,
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  prompt: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  hit: { position: 'absolute', width: HIT, height: HIT, borderRadius: HIT / 2 },
});
