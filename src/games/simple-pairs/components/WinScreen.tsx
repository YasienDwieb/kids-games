import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../../../components/common';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../../constants';

type WinScreenProps = {
  moves: number;
  onPlayAgain: () => void;
  visible: boolean;
};

const STARS = ['⭐', '⭐', '⭐'];
const STAR_DELAY = 300;

export function WinScreen({ moves, onPlayAgain, visible }: WinScreenProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0)).current;
  const starAnims = useRef(STARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) {
      overlayOpacity.setValue(0);
      contentScale.setValue(0);
      starAnims.forEach((a) => a.setValue(0));
      return;
    }

    Animated.sequence([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.stagger(
        STAR_DELAY,
        starAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [visible, overlayOpacity, contentScale, starAnims]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <Animated.View style={[styles.content, { transform: [{ scale: contentScale }] }]}>
        <Text style={styles.title}>You Did It! 🎉</Text>

        <View style={styles.starsRow}>
          {STARS.map((star, i) => (
            <Animated.Text
              key={i}
              style={[styles.star, { transform: [{ scale: starAnims[i] }] }]}
            >
              {star}
            </Animated.Text>
          ))}
        </View>

        <Text style={styles.subtitle}>
          {moves === 1 ? '1 move' : `${moves} moves`} — Amazing! 👏
        </Text>

        <BigButton
          title="Play Again 🎮"
          onPress={onPlayAgain}
          color={COLORS.primary.green}
          style={styles.button}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    padding: SPACING.lg,
  },
  content: {
    backgroundColor: COLORS.background.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
  },
  star: {
    fontSize: 56,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  button: {
    width: '100%',
  },
});
