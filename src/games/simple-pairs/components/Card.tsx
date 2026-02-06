import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import type { Card as CardType } from '../types';
import { LAYOUT, TIMING, GAME_COLORS } from '../constants';
import { COLORS } from '../../../constants';

type CardProps = {
  card: CardType;
  onPress: (cardId: string) => void;
  disabled: boolean;
  size?: number;
};

export function Card({ card, onPress, disabled, size }: CardProps) {
  const cardSize = size ?? LAYOUT.CARD_SIZE;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const showFront = card.isFlipped || card.isMatched;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: showFront ? 1 : 0,
      duration: TIMING.FLIP_DURATION,
      useNativeDriver: true,
    }).start();
  }, [showFront, flipAnim]);

  const handlePressIn = () => {
    if (disabled || showFront) return;
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || showFront) return;
    onPress(card.id);
  };

  // Back: visible when flipAnim 0→0.5, hidden after
  const backRotation = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '90deg'],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.501, 1],
    outputRange: [1, 1, 0, 0],
  });

  // Front: hidden until 0.5, then visible 0.5→1
  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-90deg', '-90deg', '0deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled && !showFront}
    >
      <Animated.View style={[styles.wrapper, { width: cardSize, height: cardSize }, { transform: [{ scale: scaleAnim }] }]}>
        {/* Back face */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { width: cardSize, height: cardSize },
            { transform: [{ rotateY: backRotation }], opacity: backOpacity },
          ]}
        >
          <Text style={[styles.questionMark, { fontSize: cardSize * 0.4 }]}>?</Text>
        </Animated.View>

        {/* Front face */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            card.isMatched && styles.cardMatched,
            { width: cardSize, height: cardSize },
            { transform: [{ rotateY: frontRotation }], opacity: frontOpacity },
          ]}
        >
          <Text style={[styles.emoji, { fontSize: cardSize * 0.48 }]}>{card.image}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  card: {
    position: 'absolute',
    borderRadius: LAYOUT.CARD_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardBack: {
    backgroundColor: GAME_COLORS.cardBack,
  },
  cardFront: {
    backgroundColor: GAME_COLORS.cardFace,
  },
  cardMatched: {
    backgroundColor: GAME_COLORS.matched,
    borderWidth: 3,
    borderColor: '#66BB6A',
  },
  questionMark: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emoji: {},
});
