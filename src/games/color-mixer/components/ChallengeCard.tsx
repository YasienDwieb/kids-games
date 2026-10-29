import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { ACCENTS, COLORS, FONTS, OUTLINE, SHADOWS, BORDER_RADIUS, useTranslation } from '@/sdk';
import { RecipeRow } from './RecipeRow';
import { challengeHex } from '../utils';
import type { Challenge } from '../types';

type ChallengeCardProps = {
  challenge: Challenge;
  isComplete: boolean;
  onSelect: () => void;
  style?: ViewStyle;
};

const DIFFICULTY_STARS: Record<Challenge['difficulty'], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export function ChallengeCard({ challenge, isComplete, onSelect, style }: ChallengeCardProps) {
  const { t } = useTranslation();
  const hex = challengeHex(challenge);
  const stars = DIFFICULTY_STARS[challenge.difficulty];

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        isComplete && styles.cardComplete,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      {/* Color preview */}
      <View style={styles.blobArea}>
        {isComplete ? (
          <ColorBlob color={hex} size={48} showShine />
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
          {isComplete && challenge.targetColor
            ? t(`color-mixer:colors.${challenge.targetColor}`)
            : t('color-mixer:card.mysteryColor')}
        </Text>

        {/* Difficulty stars */}
        <Text style={styles.stars}>
          {'★'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </Text>

        {/* The hint is the recipe as pictures, so non-readers can use it too. */}
        <View style={styles.recipe} accessible accessibilityLabel={challenge.hint ? t(`color-mixer:challengeHints.${challenge.id}`) : undefined}>
          <RecipeRow recipe={challenge.recipe} size={16} />
        </View>
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
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
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
    marginEnd: 14,
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
    end: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENTS.green.base,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
    color: COLORS.ink,
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
  recipe: {
    alignSelf: 'flex-start',
  },
});
