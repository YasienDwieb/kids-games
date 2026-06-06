import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { PressableButton, Star } from '../../../components/common';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../../../constants';

type WinScreenProps = {
  visible: boolean;
  moves: number;
  stars: number;
  onPlayAgain: () => void;
  onPickLevel: () => void;
};

const CONFETTI = ['🎉', '⭐', '🎊', '✨', '🌟'];
const SCREEN_H = Dimensions.get('window').height;

function ConfettiPiece({ index }: { index: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const left = useMemo(() => Math.random() * 100, []);
  const emoji = CONFETTI[index % CONFETTI.length];
  const size = useMemo(() => 16 + Math.random() * 16, []);
  const delay = useMemo(() => Math.random() * 500, []);
  const duration = useMemo(() => 1600 + Math.random() * 1400, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(fall, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [fall, duration, delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, SCREEN_H] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });

  return (
    <Animated.Text
      style={[
        styles.confetti,
        { left: `${left}%`, fontSize: size, transform: [{ translateY }, { rotate }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export function WinScreen({ visible, moves, stars, onPlayAgain, onPickLevel }: WinScreenProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      overlayOpacity.setValue(0);
      pop.setValue(0);
      starAnims.forEach((a) => a.setValue(0));
      return;
    }
    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.stagger(
        180,
        starAnims.map((a) =>
          Animated.spring(a, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true })
        )
      ),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, overlayOpacity, pop, starAnims, pulse]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <View style={styles.confettiLayer} pointerEvents="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </View>

      <Animated.View style={[styles.card, { transform: [{ scale: pop }] }]}>
        <Animated.Text style={[styles.hero, { transform: [{ scale: pulse }] }]}>🎉</Animated.Text>
        <Text style={styles.title}>You did it!</Text>
        <Text style={styles.subtitle}>
          All pairs matched in {moves} {moves === 1 ? 'move' : 'moves'}
        </Text>

        <View style={styles.starsRow}>
          {starAnims.map((a, i) => (
            <Animated.View key={i} style={{ transform: [{ scale: a }] }}>
              <Star size={i === 1 ? 52 : 44} filled={i < stars} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.actions}>
          <PressableButton label="Play again" accent="green" onPress={onPlayAgain} style={styles.action} />
          <PressableButton label="Pick a level" variant="ghost" onPress={onPickLevel} style={styles.action} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    padding: 26,
  },
  confettiLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  confetti: { position: 'absolute', top: 0 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.tile,
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 26,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...SHADOWS.lg,
  },
  hero: { fontSize: 64, lineHeight: 70 },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: COLORS.ink,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 22,
  },
  actions: { width: '100%', gap: 10 },
  action: { width: '100%' },
});
