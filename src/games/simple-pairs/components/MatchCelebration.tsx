import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { TIMING } from '../constants';

type MatchCelebrationProps = {
  visible: boolean;
  onComplete: () => void;
};

export function MatchCelebration({ visible, onComplete }: MatchCelebrationProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0);
    opacity.setValue(1);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        delay: TIMING.MATCH_CELEBRATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, [visible, scale, opacity, onComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity, transform: [{ scale }] }]}
    >
      <Text style={styles.emoji}>✨</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  emoji: {
    fontSize: 80,
  },
});
