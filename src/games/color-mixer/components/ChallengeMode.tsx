import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { Sparkles } from './Sparkles';
import { COLORS } from '../constants';
import type { Challenge, ColorId } from '../types';

type ChallengeModeProps = {
  currentChallenge: Challenge;
  resultColor: ColorId | null;
  onChallengeComplete: () => void;
  onBack: () => void;
};

export function ChallengeMode({
  currentChallenge,
  resultColor,
  onChallengeComplete,
  onBack,
}: ChallengeModeProps) {
  const [showHint, setShowHint] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const targetData = COLORS[currentChallenge.targetColor];
  const isCorrect = resultColor === currentChallenge.targetColor;

  useEffect(() => {
    if (isCorrect && !showSuccess) {
      setShowSuccess(true);
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(onChallengeComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, showSuccess, successScale, onChallengeComplete]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Challenges</Text>
        </Pressable>
      </View>

      {/* Target display */}
      <View style={styles.targetArea}>
        <Text style={styles.prompt}>Make this color:</Text>
        <View style={styles.targetBlob}>
          <ColorBlob
            color={targetData.hex}
            size={80}
            showShine
            pulsing={!showSuccess}
          />
        </View>
        <Text style={[styles.targetName, { color: targetData.hex }]}>
          {targetData.name}
        </Text>
      </View>

      {/* Hint */}
      {currentChallenge.hint && !showHint && (
        <Pressable
          onPress={() => setShowHint(true)}
          style={styles.hintButton}
        >
          <Text style={styles.hintButtonText}>💡 Need a hint?</Text>
        </Pressable>
      )}
      {showHint && currentChallenge.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 {currentChallenge.hint}</Text>
        </View>
      )}

      {/* Wrong result feedback */}
      {resultColor && !isCorrect && (
        <View style={styles.wrongResult}>
          <Text style={styles.wrongText}>
            Not quite! You made {COLORS[resultColor].name}. Try again!
          </Text>
        </View>
      )}

      {/* Success overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <Animated.View style={[styles.successContent, { transform: [{ scale: successScale }] }]}>
            <Sparkles color={targetData.hex} radius={100} />
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successText}>You did it!</Text>
            <ColorBlob color={targetData.hex} size={70} showShine />
            <Text style={[styles.successColor, { color: targetData.hex }]}>
              {targetData.name}
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
  },
  header: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  targetArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 12,
  },
  targetBlob: {
    marginBottom: 8,
  },
  targetName: {
    fontSize: 24,
    fontWeight: '800',
  },
  hintButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FFF9C4',
    borderRadius: 20,
    marginBottom: 12,
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9A825',
  },
  hintBox: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57F17',
  },
  wrongResult: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  wrongText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    textAlign: 'center',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  successContent: {
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  successText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#424242',
    marginBottom: 16,
  },
  successColor: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
  },
});
