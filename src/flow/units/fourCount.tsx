import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS, FONTS, FONT_SIZES, COLORS,
  makeActor, rowLayout, useSound, useTranslation,
  type Actor, type FlowUnit, type FlowUnitContext, type FlowUnitProps,
} from '@/sdk';
import { buildCountThisMany } from '@/games/count-and-pop/utils/generate';
import { StarSprite } from './StarSprite';

// Target sourced from the count-and-pop domain generator (real reuse).
export const FOUR_COUNT_TARGET = buildCountThisMany(1, 4).target; // === 4

const STAR_SIZE = 72;
const HIT = 88;

export function fourCountActors(ctx: FlowUnitContext): Actor[] {
  const pts = rowLayout(FOUR_COUNT_TARGET, {
    cx: ctx.width / 2,
    cy: ctx.height * 0.5,
    gap: STAR_SIZE + 32,
  });
  return pts.map((p, i) =>
    makeActor({
      id: `star-${i}`,
      x: p.x,
      y: p.y,
      content: <StarSprite color={ACCENTS.pink.base} size={STAR_SIZE} />,
    }),
  );
}

function FourCountComponent({ actors, onComplete }: FlowUnitProps) {
  const { play } = useSound();
  const { t } = useTranslation();
  const [counted, setCounted] = useState<Set<string>>(new Set());

  const handleTap = (id: string) => {
    if (counted.has(id)) return;
    void play('pop');
    const next = new Set(counted);
    next.add(id);
    setCounted(next);
    if (next.size >= FOUR_COUNT_TARGET) {
      void play('success');
      setTimeout(onComplete, 450);
    }
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Text style={styles.prompt}>{t('flow.fourCount.prompt')}</Text>
      <Text style={styles.counter}>{counted.size}</Text>
      {actors.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => handleTap(a.id)}
          accessibilityLabel={t('flow.fourCount.starLabel')}
          style={[
            styles.hit,
            { left: a.x - HIT / 2, top: a.y - HIT / 2, opacity: counted.has(a.id) ? 0.4 : 1 },
          ]}
        />
      ))}
    </View>
  );
}

export const fourCount: FlowUnit = {
  id: 'four-count',
  topicId: 'four',
  enterActors: fourCountActors,
  exitActors: fourCountActors, // settle in place; next unit morphs from here
  Component: FourCountComponent,
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
  counter: {
    fontFamily: FONTS.displayBold,
    fontSize: 40,
    color: ACCENTS.pink.deep,
    textAlign: 'center',
  },
  hit: { position: 'absolute', width: HIT, height: HIT, borderRadius: HIT / 2 },
});
