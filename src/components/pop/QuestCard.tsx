import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ACCENTS, COLORS, FONTS, OUTLINE, SHADOWS } from '../../constants';
import { getGame } from '../../sdk/config/registry';
import { gameName } from '../../sdk/i18n/gameMeta';
import { questDone, type Quest } from '../../sdk/quests/quests';
import { Icon } from '../common/Icon';

/** One quest's sentence, e.g. "Win 3 in Balloon Archer". */
export function useQuestLabel() {
  const { t } = useTranslation();
  return (q: Quest) => {
    if (q.kind === 'game-stars') {
      const game = q.gameId ? getGame(q.gameId) : undefined;
      return t('quests.gameStars', { n: q.target, game: game ? gameName(game) : '' });
    }
    if (q.kind === 'variety') return t('quests.variety', { n: q.target });
    return t('quests.stars', { n: q.target });
  };
}

/** Round status pip: a tick when done, else "2/5". */
export function QuestPip({ quest, size = 26 }: { quest: Quest; size?: number }) {
  const { t } = useTranslation();
  const done = questDone(quest);
  return (
    <View
      style={[
        styles.pip,
        { width: size, height: size, borderRadius: size / 2 },
        done && { backgroundColor: ACCENTS.green.base },
      ]}
    >
      {done ? (
        <Icon name="checkmark" size={size * 0.62} />
      ) : (
        <Text style={[styles.pipText, { fontSize: size * 0.36 }]}>
          {t('quests.progress', { n: quest.progress, target: quest.target })}
        </Text>
      )}
    </View>
  );
}

type QuestCardProps = {
  quests: Quest[];
  onPress: () => void;
};

/** Home's "Today's quests" summary; tapping opens the quest board. */
export function QuestCard({ quests, onPress }: QuestCardProps) {
  const { t } = useTranslation();
  const label = useQuestLabel();
  const done = quests.filter(questDone).length;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('quests.today')}. ${t('quests.allDoneA11y', { done, total: quests.length })}`}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : SHADOWS.md]}
    >
      <Text style={styles.title} numberOfLines={1}>
        {t('quests.today')}
      </Text>
      {quests.map((q) => (
        <View key={q.id} style={styles.row}>
          <QuestPip quest={q} />
          <Text style={[styles.rowText, questDone(q) && styles.rowDone]} numberOfLines={1}>
            {label(q)}
          </Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    gap: 6,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  title: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, textAlign: 'left' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink, textAlign: 'left' },
  rowDone: { color: COLORS.inkSoft, textDecorationLine: 'line-through' },
  pip: {
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipText: { fontFamily: FONTS.display, color: COLORS.ink, direction: 'ltr' },
});
