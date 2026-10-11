import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, EmojiImage, FONTS, OUTLINE, SHADOWS, BORDER_RADIUS, useTranslation } from '@/sdk';
import { ChallengeCard } from './ChallengeCard';
import type { Challenge } from '../types';

type ChallengePickerProps = {
  challenges: Challenge[];
  completedChallenges: string[];
  onSelectChallenge: (challenge: Challenge) => void;
  onBack: () => void;
};

const DIFFICULTY_ORDER: Challenge['difficulty'][] = ['easy', 'medium', 'hard'];

export function ChallengePicker({
  challenges,
  completedChallenges,
  onSelectChallenge,
  onBack,
}: ChallengePickerProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  // Two columns in landscape: one full-width card per row wastes the panel and pushes the
  // harder groups below the fold on a phone.
  const landscape = width > height;

  const difficultyLabel = (diff: Challenge['difficulty']): string =>
    t(`color-mixer:picker.difficulty.${diff}`);

  const grouped = DIFFICULTY_ORDER.map((diff) => ({
    difficulty: diff,
    label: difficultyLabel(diff),
    items: challenges.filter((c) => c.difficulty === diff),
  })).filter((g) => g.items.length > 0);

  const completedCount = completedChallenges.length;
  const totalCount = challenges.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backPill, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>{t('color-mixer:picker.backButton')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('color-mixer:picker.title')}</Text>
        <Text style={styles.progress}>
          {completedCount}/{totalCount} {t('color-mixer:picker.complete')}
        </Text>
      </View>

      {/* Challenge list */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {grouped.map((group) => (
          <View key={group.difficulty} style={styles.group}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <View style={[styles.cardList, landscape && styles.cardGrid]}>
              {group.items.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  style={landscape ? styles.gridCard : undefined}
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
            <EmojiImage emoji="🏆" size={48} style={styles.allDoneEmoji} />
            <Text style={styles.allDoneText}>{t('color-mixer:picker.allDone')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backPill: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    ...SHADOWS.sm,
  },
  pressed: { opacity: 0.7 },
  backText: {
    fontSize: 15,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.displayBold,
    color: COLORS.ink,
    marginTop: 4,
  },
  progress: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
    marginTop: 2,
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
    fontFamily: FONTS.display,
    color: COLORS.inkSoft,
    marginBottom: 10,
    paddingStart: 4,
  },
  cardList: {
    gap: 10,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCard: {
    // Two per row, accounting for the 10dp gap.
    width: '48.5%',
  },
  allDone: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 20,
  },
  allDoneEmoji: {
    marginBottom: 8,
  },
  allDoneText: {
    fontSize: 20,
    fontFamily: FONTS.displayBold,
    color: COLORS.brand,
  },
});
