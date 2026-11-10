/**
 * MakeNTray — "how many more to reach the flag?", as one tray.
 *
 * Exactly `target` slots: the objects a child already has, then a ghost of each
 * one still missing, then the target numeral at the end like a finish flag.
 *
 * A tapped number is tried out, not just judged: that many objects pop in. Too
 * few and the gaps left over wiggle; too many and the extras bounce off the flag.
 * RTL: a plain flex row, so the tray fills from the reading start.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ACCENTS, BORDER_RADIUS, ClayEmoji, COLORS, FONT_SIZES, FONTS, OUTLINE, SHADOWS, SPACING } from '@/sdk';
import type { MakeNRound } from '../types';

const MAX_SLOT = 62;
const GAP = SPACING.xs;
const FLAG = 76;
/** Space the tray keeps for its padding, the flag and the screen's edges. */
const RESERVED = FLAG + SPACING.md * 2 + SPACING.lg * 2 + SPACING.xl * 2;
const STAGGER_MS = 60;

type SlotState = 'have' | 'tried' | 'ghost' | 'gap';

function Slot({ emoji, state, size, order }: { emoji: string; state: SlotState; size: number; order: number }) {
  const pop = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0);
    if (state !== 'tried') return;
    Animated.sequence([
      Animated.delay(order * STAGGER_MS),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
    ]).start();
  }, [state, order, pop]);

  useEffect(() => {
    if (state !== 'gap') return;
    Animated.sequence([
      Animated.delay(320),
      ...[6, -6, 5, -5, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 60, useNativeDriver: true }),
      ),
    ]).start();
  }, [state, shake]);

  const filled = state === 'have' || state === 'tried';
  return (
    <Animated.View
      style={[
        styles.slot,
        { width: size, height: size },
        filled ? styles.slotFilled : styles.slotGhost,
        state === 'gap' && styles.slotGap,
        { transform: [{ translateX: shake }] },
      ]}
    >
      {filled ? null : (
        <View style={styles.ghost}>
          <ClayEmoji emoji={emoji} size={size * 0.62} />
        </View>
      )}
      {state === 'have' ? <ClayEmoji emoji={emoji} size={size * 0.68} /> : null}
      {state === 'tried' ? (
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <ClayEmoji emoji={emoji} size={size * 0.68} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/** One object too many: pops out of the flag and falls away. */
function Bounced({ emoji, index }: { emoji: string; index: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(240 + index * STAGGER_MS),
      Animated.timing(t, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [index, t]);
  const dir = index % 2 === 0 ? 1 : -1;
  return (
    <Animated.View
      style={[
        styles.bounced,
        {
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dir * (22 + index * 10)] }) },
            { translateY: t.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, -46, 14] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${dir * 160}deg`] }) },
          ],
        },
      ]}
    >
      <ClayEmoji emoji={emoji} size={34} />
    </Animated.View>
  );
}

type MakeNTrayProps = {
  round: MakeNRound;
  /** The number just tapped, tried out in the tray; null while waiting. */
  tried: number | null;
};

export function MakeNTray({ round, tried }: MakeNTrayProps) {
  const { width } = useWindowDimensions();
  const { have, target, objectEmoji } = round;
  const size = Math.min(MAX_SLOT, Math.floor((width - RESERVED) / target) - GAP);

  const reach = tried === null ? have : have + tried;
  const short = tried !== null && reach < target;
  const extras = tried === null ? 0 : Math.max(0, reach - target);
  const full = reach === target;

  const flag = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!full) return;
    flag.setValue(1);
    Animated.sequence([
      Animated.delay((tried ?? 0) * STAGGER_MS + 120),
      Animated.spring(flag, { toValue: 1.25, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.spring(flag, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [full, tried, flag]);

  const stateAt = (i: number): SlotState => {
    if (i < have) return 'have';
    if (i < reach) return 'tried';
    return short ? 'gap' : 'ghost';
  };

  return (
    <View style={[styles.tray, SHADOWS.md]}>
      <View style={styles.slots}>
        {Array.from({ length: target }, (_, i) => (
          <Slot key={i} emoji={objectEmoji} state={stateAt(i)} size={size} order={i - have} />
        ))}
      </View>
      <View style={styles.flagWrap}>
        <Animated.View style={[styles.flag, SHADOWS.sm, { transform: [{ scale: flag }] }]}>
          <Text style={styles.flagText}>{target}</Text>
        </Animated.View>
        {Array.from({ length: extras }, (_, i) => (
          <Bounced key={i} emoji={objectEmoji} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  slots: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  slot: { alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.soft },
  slotFilled: {
    backgroundColor: ACCENTS.green.tint,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
  },
  slotGhost: {
    backgroundColor: COLORS.canvas2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.inkFaint,
  },
  slotGap: { borderColor: ACCENTS.coral.base, backgroundColor: ACCENTS.coral.tint },
  ghost: { opacity: 0.22 },
  flagWrap: { alignItems: 'center', justifyContent: 'center' },
  flag: {
    width: FLAG,
    height: FLAG,
    borderRadius: FLAG / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENTS.pink.base,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  flagText: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl + 4,
    color: COLORS.ink,
  },
  bounced: { position: 'absolute' },
});
