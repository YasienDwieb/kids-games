import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS, BORDER_RADIUS, IconButton } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { Sparkles } from './Sparkles';
import { COLORS } from '../constants';
import { closeness, isChallengeMet } from '../utils';
import type { Challenge } from '../types';

type ChallengeModeProps = {
  currentChallenge: Challenge;
  currentMixHex: string | null;
  onChallengeComplete: () => void;
  onBack: () => void;
};

function meterLabel(meter: number): string {
  if (meter >= 1) return 'Perfect!';
  if (meter >= 0.85) return 'So close!';
  if (meter >= 0.6) return 'Getting warmer…';
  return 'Keep mixing!';
}

export function ChallengeMode({
  currentChallenge,
  currentMixHex,
  onChallengeComplete,
  onBack,
}: ChallengeModeProps) {
  const [showHint, setShowHint] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const targetData = COLORS[currentChallenge.targetColor];
  const targetHex = targetData.hex;
  const isCorrect = isChallengeMet(currentMixHex, targetHex);
  const meter = currentMixHex ? closeness(currentMixHex, targetHex) : 0;

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
        <IconButton glyph="←" onPress={onBack} accessibilityLabel="Back to challenges" size={44} />
      </View>

      {/* Target display */}
      <View style={styles.targetArea}>
        <Text style={styles.prompt}>Make this color:</Text>
        <View style={styles.targetBlob}>
          <ColorBlob
            color={targetHex}
            size={80}
            showShine
            pulsing={!showSuccess}
          />
        </View>
        <Text style={styles.targetName}>{targetData.name}</Text>
      </View>

      {/* Hint */}
      {currentChallenge.hint && !showHint && (
        <Text onPress={() => setShowHint(true)} style={styles.hintButton}>
          💡 Need a hint?
        </Text>
      )}
      {showHint && currentChallenge.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 {currentChallenge.hint}</Text>
        </View>
      )}

      {/* Closeness meter */}
      {currentMixHex && !isCorrect && (
        <View style={styles.meterArea}>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.round(meter * 100)}%` }]} />
          </View>
          <Text style={styles.meterLabel}>{meterLabel(meter)}</Text>
        </View>
      )}

      {/* Success overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <Animated.View style={[styles.successContent, { transform: [{ scale: successScale }] }]}>
            <Sparkles color={targetHex} radius={100} />
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successText}>You did it!</Text>
            <ColorBlob color={targetHex} size={70} showShine />
            <Text style={styles.successColor}>{targetData.name}</Text>
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
    alignItems: 'flex-start',
  },
  targetArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  prompt: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: TOKENS.inkSoft,
    marginBottom: 12,
  },
  targetBlob: {
    marginBottom: 8,
  },
  targetName: {
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    color: TOKENS.ink,
  },
  hintButton: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: TOKENS.inkSoft,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  hintBox: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: TOKENS.surface2,
    borderRadius: BORDER_RADIUS.soft,
    marginBottom: 12,
  },
  hintText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: TOKENS.inkSoft,
  },
  meterArea: {
    width: '70%',
    alignItems: 'center',
  },
  meterTrack: {
    width: '100%',
    height: 12,
    backgroundColor: TOKENS.line2,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: TOKENS.brand,
    borderRadius: BORDER_RADIUS.pill,
  },
  meterLabel: {
    marginTop: 8,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: TOKENS.inkSoft,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.overlay,
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
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: TOKENS.surface,
    marginBottom: 16,
  },
  successColor: {
    marginTop: 8,
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: TOKENS.surface,
  },
});
