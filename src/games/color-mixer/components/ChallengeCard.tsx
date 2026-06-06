import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { ACCENTS, COLORS, FONTS, SHADOWS, BORDER_RADIUS } from '@/sdk';
import { COLORS as PALETTE } from '../constants';
import type { Challenge } from '../types';

type ChallengeCardProps = {
  challenge: Challenge;
  isComplete: boolean;
  onSelect: () => void;
};

const DIFFICULTY_STARS: Record<Challenge['difficulty'], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export function ChallengeCard({ challenge, isComplete, onSelect }: ChallengeCardProps) {
  const colorData = PALETTE[challenge.targetColor];
  const stars = DIFFICULTY_STARS[challenge.difficulty];

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        isComplete && styles.cardComplete,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Color preview */}
      <View style={styles.blobArea}>
        {isComplete ? (
          <ColorBlob color={colorData.hex} size={48} showShine />
        ) : (
          <View style={styles.mysteryBlob}>
            <Text style={styles.mysteryIcon}>?</Text>
          </View>
        )}
        {isComplete && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.targetName}>
          {isComplete ? colorData.name : 'Mystery Color'}
        </Text>

        {/* Difficulty stars */}
        <Text style={styles.stars}>
          {'★'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </Text>

        {challenge.hint && (
          <Text style={styles.hint} numberOfLines={2}>
            {challenge.hint}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: 14,
    ...SHADOWS.sm,
  },
  cardComplete: {
    backgroundColor: ACCENTS.green.tint,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  blobArea: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mysteryBlob: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.canvas2,
    borderWidth: 2,
    borderColor: COLORS.line2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mysteryIcon: {
    fontSize: 22,
    fontFamily: FONTS.displayBold,
    color: COLORS.inkFaint,
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENTS.green.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
    color: COLORS.surface,
  },
  info: {
    flex: 1,
  },
  targetName: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 2,
  },
  stars: {
    fontSize: 14,
    color: COLORS.gold,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
  },
});
