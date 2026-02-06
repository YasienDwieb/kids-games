import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { COLORS } from '../constants';
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
  const colorData = COLORS[challenge.targetColor];
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardComplete: {
    backgroundColor: '#E8F5E9',
  },
  cardPressed: {
    opacity: 0.8,
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
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#BDBDBD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mysteryIcon: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9E9E9E',
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#43A047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  targetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 2,
  },
  stars: {
    fontSize: 14,
    color: '#FFB300',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
});
