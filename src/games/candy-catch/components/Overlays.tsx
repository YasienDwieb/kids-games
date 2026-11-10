import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ACCENTS,
  ClayEmoji,
  EmojiImage,
  Icon,
  Mascot,
  PressableButton,
  COLORS,
  SHADOWS,
  OUTLINE,
  BORDER_RADIUS,
  SPACING,
  TOUCH_TARGET,
  pulse,
  useLoop,
  useReduceMotion,
  useTranslation,
} from '@/sdk';
import { BOMB, CHILI, GOOD_ITEMS } from '../constants';
import { Basket } from './Basket';

const STAGE_H = 240;
/** How far a falling item travels before it lands in the basket. */
const STAGE_DROP = 118;

function usePopIn() {
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);
  return scale;
}

function Card({ children }: { children: React.ReactNode }) {
  const scale = usePopIn();
  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>{children}</Animated.View>
    </View>
  );
}

type Beat = { items: readonly string[]; reward: string; good: boolean };
const YUM: Beat = { items: GOOD_ITEMS.map((i) => i.emoji), reward: '⭐', good: true };
const YUCK: Beat = { items: [BOMB.emoji, CHILI.emoji], reward: '💔', good: false };

/** A tiny stage acting out one rule: something falls in the basket, and this happens. */
function Stage({ beat, delay }: { beat: Beat; delay: number }) {
  const [turn, setTurn] = useState(0);
  const drop = useRef(new Animated.Value(0)).current;
  const react = useRef(new Animated.Value(0)).current;
  const hit = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();

  useEffect(() => {
    if (reduce) {
      // A still picture of the whole rule: the item above, what it does below.
      drop.setValue(0);
      react.setValue(1);
      return;
    }
    let live = true;
    const play = () => {
      drop.setValue(0);
      react.setValue(0);
      hit.setValue(0);
      Animated.sequence([
        Animated.timing(drop, { toValue: 1, duration: 720, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.parallel([
          Animated.spring(react, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
          Animated.timing(hit, { toValue: 1, duration: 420, useNativeDriver: true }),
        ]),
        Animated.delay(900),
      ]).start(({ finished }) => {
        if (!live || !finished) return;
        setTurn((n) => n + 1);
        play();
      });
    };
    const start = setTimeout(play, delay);
    return () => {
      live = false;
      clearTimeout(start);
    };
  }, [delay, drop, hit, react, reduce]);

  const basketMove = beat.good
    ? { translateY: hit.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, -18, 0] }) }
    : { translateX: hit.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -10, 10, -7, 7, 0] }) };

  return (
    <View style={[styles.stage, { backgroundColor: ACCENTS[beat.good ? 'green' : 'coral'].tint }]}>
      <Animated.View
        style={[
          styles.falling,
          {
            opacity: drop.interpolate({ inputRange: [0, 0.9, 1], outputRange: [1, 1, 0] }),
            transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [0, STAGE_DROP] }) }],
          },
        ]}
      >
        <ClayEmoji emoji={beat.items[turn % beat.items.length]} size={62} />
      </Animated.View>
      <Animated.View
        style={[
          styles.reward,
          {
            opacity: react,
            transform: [
              { translateY: react.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
              { scale: react },
            ],
          },
        ]}
      >
        <EmojiImage emoji={beat.reward} size={72} />
      </Animated.View>
      <Animated.View style={[styles.basket, { transform: [basketMove, { scale: 0.62 }] }]}>
        <Basket />
      </Animated.View>
    </View>
  );
}

/** No words and no ticks: both rules play out, with the play button between them. */
export function StartOverlay({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  const beat = useLoop(900);
  const insets = useSafeAreaInsets();
  return (
    // Starts below the top bar, so the back button and hearts stay in reach.
    <View style={[styles.theatre, { top: insets.top + TOUCH_TARGET.recommended + SPACING.md }]}>
      <Stage beat={YUM} delay={0} />
      <Animated.View style={pulse(beat, 0.08)}>
        <PressableButton
          accessibilityLabel={t('candy-catch:start.tap')}
          accent="pink"
          onPress={onStart}
        >
          <View style={styles.play}>
            <Icon name="play" size={44} />
          </View>
        </PressableButton>
      </Animated.View>
      <Stage beat={YUCK} delay={700} />
    </View>
  );
}

/** The short breather after losing the hearts; the round restarts by itself. */
export function LoseOverlay() {
  return (
    <Card>
      <Mascot pose="encourage" size={120} />
    </Card>
  );
}

const styles = StyleSheet.create({
  theatre: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.canvas,
    zIndex: 20,
  },
  stage: {
    width: 230,
    height: '100%',
    maxHeight: STAGE_H,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.tile,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    ...SHADOWS.md,
  },
  falling: { position: 'absolute', top: 6 },
  reward: { position: 'absolute', top: 78 },
  basket: { position: 'absolute', bottom: -6 },
  play: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    zIndex: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.tile,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
    maxWidth: 320,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    ...SHADOWS.lg,
  },
});
