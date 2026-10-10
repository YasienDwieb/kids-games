// Quest board — today's three quests with Claim buttons, and the mystery chest
// that opens once all three are claimed. New quests arrive each day; nothing is
// ever taken away for a missed day.
import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { AppBar, EmojiImage, PressableButton } from '../components/common';
import { LevelPill, PopBackdrop, ProgressBar, QuestPip, pulse, useLoop, useQuestLabel, wiggle } from '../components/pop';
import {
  ACCENTS,
  CHEST_STARS,
  CelebrationProvider,
  getGame,
  chestReady,
  claimQuest,
  openChest,
  questDone,
  useCelebrate,
  useQuests,
  useRewards,
  useSound,
  useTranslation,
  type Quest,
} from '@/sdk';
import { COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Quests'>;

const ROW_COLORS = [POP.bubblegum, POP.splash, POP.grape];

/** The quest's picture: its game's icon, a controller for variety, a star for stars. */
function questIcon(q: Quest): string {
  if (q.kind === 'game-stars') return (q.gameId && getGame(q.gameId)?.icon) || '🎮';
  return q.kind === 'variety' ? '🎮' : '⭐';
}

function QuestRow({ quest, index }: { quest: Quest; index: number }) {
  const { t } = useTranslation();
  const label = useQuestLabel();
  const celebrate = useCelebrate();
  const beat = useLoop(1100, { enabled: questDone(quest) && !quest.claimed });
  const done = questDone(quest);

  const claim = async () => {
    if (await claimQuest(quest.id)) void celebrate('small');
  };

  return (
    <View style={[styles.row, SHADOWS.md]}>
      <View style={[styles.rowIcon, { backgroundColor: ROW_COLORS[index % ROW_COLORS.length] }]}>
        {done ? <QuestPip quest={quest} size={34} /> : <EmojiImage emoji={questIcon(quest)} size={32} />}
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowText} numberOfLines={2}>
          {label(quest)}
        </Text>
        <ProgressBar value={quest.progress / quest.target} color={done ? ACCENTS.green.base : ROW_COLORS[index % 3]} height={14} />
      </View>
      {quest.claimed ? (
        <Text style={styles.claimed}>{t('quests.claimed')}</Text>
      ) : done ? (
        <Animated.View style={pulse(beat, 0.08)}>
          <PressableButton label={t('quests.claim')} onPress={claim} style={styles.claimBtn} />
        </Animated.View>
      ) : (
        <Text style={styles.count}>{t('quests.progress', { n: quest.progress, target: quest.target })}</Text>
      )}
    </View>
  );
}

function Chest({ ready, opened }: { ready: boolean; opened: boolean }) {
  const { t } = useTranslation();
  const celebrate = useCelebrate();
  const { play } = useSound();
  const shake = useLoop(900, { enabled: ready });
  const [justOpened, setJustOpened] = useState(false);

  const open = async () => {
    if (await openChest()) {
      setJustOpened(true);
      play('sfx.powerup');
      void celebrate('big');
    }
  };

  return (
    <View style={[styles.chestCard, SHADOWS.lg]}>
      <Text style={styles.chestIntro}>{t('quests.chestIntro')}</Text>
      <Animated.Text style={[styles.chestGlyph, wiggle(shake, 7)]}>{opened ? '🎁' : '🧰'}</Animated.Text>
      <Text style={styles.chestTitle}>{t('quests.chest')}</Text>
      {opened || justOpened ? (
        <Text style={styles.chestNote}>{t('quests.opened', { n: CHEST_STARS })}</Text>
      ) : ready ? (
        <PressableButton label={t('quests.open')} color={POP.zap} onPress={open} />
      ) : null}
      <Text style={styles.chestNote}>{t('quests.tomorrow')}</Text>
    </View>
  );
}

function Board({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const day = useQuests();
  const rewards = useRewards();
  const claimedCount = day.quests.filter((q) => q.claimed).length;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar title={t('quests.title')} onBack={onBack} right={<LevelPill stars={rewards.stars} />} />
      <View style={styles.body}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
          <Text style={styles.section}>{t('quests.today')}</Text>
          {day.quests.map((q, i) => (
            <QuestRow key={q.id} quest={q} index={i} />
          ))}
          <View style={styles.pips} accessible accessibilityLabel={t('quests.allDoneA11y', { done: claimedCount, total: day.quests.length })}>
            {day.quests.map((q) => (
              <View key={q.id} style={[styles.pip, q.claimed && styles.pipOn]} />
            ))}
          </View>
        </ScrollView>
        <Chest ready={chestReady(day)} opened={day.chestOpened} />
      </View>
    </SafeAreaView>
  );
}

export function QuestsScreen({ navigation }: Props) {
  return (
    <View style={styles.flex}>
      <PopBackdrop color={POP.zap} stripe={POP.zapDeep} />
      {/* Claims and the chest celebrate (and can level the child up) right here. */}
      <CelebrationProvider>
        <Board onBack={() => navigation.goBack()} />
      </CelebrationProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flex: 1, flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  list: { gap: 12, paddingBottom: SPACING.md, paddingEnd: 6 },
  section: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink, textAlign: 'left' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  rowIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMid: { flex: 1, gap: 6 },
  rowText: { fontFamily: FONTS.bodyExtra, fontSize: 17, color: COLORS.ink, textAlign: 'left' },
  claimBtn: { minWidth: 110 },
  claimed: { fontFamily: FONTS.display, fontSize: 18, color: ACCENTS.green.deep },
  count: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink, direction: 'ltr' },
  pips: { flexDirection: 'row', gap: 10, alignSelf: 'center', marginTop: 4 },
  pip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  pipOn: { backgroundColor: ACCENTS.green.base },
  chestCard: {
    width: 260,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 24,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.bubblegum,
  },
  chestIntro: { fontFamily: FONTS.display, fontSize: 19, color: COLORS.ink, textAlign: 'center' },
  chestGlyph: { fontSize: 72, lineHeight: 86 },
  chestTitle: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.ink, textAlign: 'center' },
  chestNote: { fontFamily: FONTS.bodyExtra, fontSize: 14, color: COLORS.ink, textAlign: 'center' },
});
