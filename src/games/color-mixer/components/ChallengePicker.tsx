import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChallengeCard } from './ChallengeCard';
import type { Challenge } from '../types';

type ChallengePickerProps = {
  challenges: Challenge[];
  completedChallenges: string[];
  onSelectChallenge: (challenge: Challenge) => void;
  onBack: () => void;
};

const DIFFICULTY_ORDER: Challenge['difficulty'][] = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABELS: Record<Challenge['difficulty'], string> = {
  easy: 'Beginner',
  medium: 'Intermediate',
  hard: 'Advanced',
};

export function ChallengePicker({
  challenges,
  completedChallenges,
  onSelectChallenge,
  onBack,
}: ChallengePickerProps) {
  const grouped = DIFFICULTY_ORDER.map((diff) => ({
    difficulty: diff,
    label: DIFFICULTY_LABELS[diff],
    items: challenges.filter((c) => c.difficulty === diff),
  })).filter((g) => g.items.length > 0);

  const completedCount = completedChallenges.length;
  const totalCount = challenges.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.progress}>
          {completedCount}/{totalCount} complete
        </Text>
      </View>

      {/* Challenge list */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {grouped.map((group) => (
          <View key={group.difficulty} style={styles.group}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <View style={styles.cardList}>
              {group.items.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isComplete={completedChallenges.includes(challenge.id)}
                  onSelect={() => onSelectChallenge(challenge)}
                />
              ))}
            </View>
          </View>
        ))}

        {completedCount === totalCount && (
          <View style={styles.allDone}>
            <Text style={styles.allDoneEmoji}>🏆</Text>
            <Text style={styles.allDoneText}>All challenges complete!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#7E57C2',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7E57C2',
    marginBottom: 10,
    paddingLeft: 4,
  },
  cardList: {
    gap: 10,
  },
  allDone: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 20,
  },
  allDoneEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  allDoneText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7E57C2',
  },
});
