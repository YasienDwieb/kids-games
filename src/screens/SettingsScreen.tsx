import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { AppBar, Chip, EmojiImage, HoldToConfirm, ParentGate } from '../components/common';
import {
  AGE_BANDS,
  useSettings,
  useTranslation,
  eligibleGameIds,
  getGame,
  gameName,
  createFlowProgressStore,
  getAllGames,
  secondsThisWeek,
  secondsToday,
  usePlaytime,
  useRewards,
} from '@/sdk';
import { COLORS, FONTS, SPACING } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const LIMIT_OPTIONS = [15, 30, 45, 60] as const;
const minutes = (seconds: number) => Math.round(seconds / 60);

/** The grown-ups' view: how long and what the child played, and a daily limit. */
function ParentsTab({ landscape }: { landscape: boolean }) {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const playtime = usePlaytime();
  const rewards = useRewards();

  const rows = getAllGames()
    .map((g) => ({
      game: g,
      seconds: playtime.games[g.id] ?? 0,
      stars: rewards.byGame[g.id] ?? 0,
    }))
    .filter((r) => r.seconds > 0 || r.stars > 0)
    .sort((a, b) => b.seconds - a.seconds);

  return (
    <View style={[styles.columns, landscape && styles.columnsLandscape]}>
      <View style={[styles.column, landscape && styles.columnLandscape]}>
        <View style={[styles.card, styles.statsCard]}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {t('settings.parents.minutes', { n: minutes(secondsToday(playtime)) })}
            </Text>
            <Text style={styles.statLabel}>{t('settings.parents.today')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {t('settings.parents.minutes', { n: minutes(secondsThisWeek(playtime)) })}
            </Text>
            <Text style={styles.statLabel}>{t('settings.parents.week')}</Text>
          </View>
        </View>

        <Text style={styles.section}>{t('settings.parents.limit')}</Text>
        <View style={styles.bands}>
          <Chip
            label={t('settings.parents.off')}
            active={settings.dailyLimitMin == null}
            onPress={() => update({ dailyLimitMin: null })}
          />
          {LIMIT_OPTIONS.map((m) => (
            <Chip
              key={m}
              label={t('settings.parents.minutes', { n: m })}
              active={settings.dailyLimitMin === m}
              onPress={() => update({ dailyLimitMin: m })}
            />
          ))}
        </View>
      </View>

      <View style={[styles.column, landscape && styles.columnLandscape]}>
        <Text style={styles.section}>{t('settings.parents.byGame')}</Text>
        <View style={styles.card}>
          {rows.length === 0 ? (
            <Text style={[styles.rowLabel, styles.emptyRow]}>{t('settings.parents.empty')}</Text>
          ) : (
            rows.map((r, i) => (
              <View key={r.game.id}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <EmojiImage emoji={r.game.icon} size={24} />
                  <Text style={styles.rowLabel}>{gameName(r.game)}</Text>
                  <Text style={styles.gameStat}>
                    {t('settings.parents.gameRow', { min: minutes(r.seconds), stars: r.stars })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.line2, true: COLORS.brand }}
        thumbColor={COLORS.surface}
        ios_backgroundColor={COLORS.line2}
      />
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { settings, update } = useSettings();
  const { t } = useTranslation();
  // Everything behind this screen (language, age filter, journey reset) breaks
  // the child's experience, so a grown-up has to get in first.
  const [unlocked, setUnlocked] = useState(false);
  // Tabs, not one scrolling page: the journey-games list grows with the
  // catalogue, so a single screen overflows again every few games. Tabs stay
  // bounded no matter how many games ship.
  const [tab, setTab] = useState<'general' | 'journey' | 'parents'>('general');
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const flowGames = eligibleGameIds(); // games that registered a flow adapter
  const selectedGameIds = settings.flowGameIds; // null = all

  const isGameOn = (id: string) => selectedGameIds == null || selectedGameIds.includes(id);

  const labelForGame = (id: string) => {
    const game = getGame(id);
    return game ? gameName(game) : id;
  };

  const toggleGame = (id: string) => {
    const current = selectedGameIds ?? flowGames;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // All selected → store null (means "all"); else store the explicit list.
    update({ flowGameIds: next.length === flowGames.length ? null : next });
  };

  const flowStore = useMemo(() => createFlowProgressStore(), []);
  const resetJourney = () => {
    flowStore.set({ step: 0, seed: 0, updatedAt: Date.now(), done: {} });
  };

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title={t('settings.title')} onBack={() => navigation.goBack()} />
        <ParentGate onPass={() => setUnlocked(true)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title={t('settings.title')} onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        <Chip
          label={t('settings.tabs.general')}
          active={tab === 'general'}
          onPress={() => setTab('general')}
        />
        <Chip
          label={t('settings.tabs.journey')}
          active={tab === 'journey'}
          onPress={() => setTab('journey')}
        />
        <Chip
          label={t('settings.tabs.parents')}
          active={tab === 'parents'}
          onPress={() => setTab('parents')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'parents' ? (
          <ParentsTab landscape={landscape} />
        ) : tab === 'general' ? (
          <View style={[styles.columns, landscape && styles.columnsLandscape]}>
            <View style={[styles.column, landscape && styles.columnLandscape]}>
              <View style={styles.card}>
                <ToggleRow
                  icon="📳"
                  label={t('settings.haptics')}
                  value={settings.hapticsEnabled}
                  onChange={(v) => update({ hapticsEnabled: v })}
                />
              </View>
            </View>

            <View style={[styles.column, landscape && styles.columnLandscape]}>
              <Text style={styles.section}>{t('settings.showGamesFor')}</Text>
              <View style={styles.bands}>
                <Chip
                  label={t('settings.all')}
                  active={settings.ageBand === null}
                  onPress={() => update({ ageBand: null })}
                />
                {AGE_BANDS.map((band) => (
                  <Chip
                    key={band.id}
                    label={t(`ageBands.${band.id}`)}
                    active={settings.ageBand === band.id}
                    onPress={() => update({ ageBand: band.id })}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.columns, landscape && styles.columnsLandscape]}>
            <View style={[styles.column, landscape && styles.columnLandscape]}>
              <Text style={styles.section}>{t('settings.guided.games')}</Text>
              <View style={styles.bands}>
                {flowGames.map((id) => (
                  <Chip
                    key={id}
                    label={labelForGame(id)}
                    active={isGameOn(id)}
                    onPress={() => toggleGame(id)}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.column, landscape && styles.columnLandscape]}>
              <Text style={styles.section}>{t('settings.guided.reset')}</Text>
              <HoldToConfirm
                label={t('flow.holdToReset')}
                accent="coral"
                onConfirm={resetJourney}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pinned, not in the scroll body: it used to sit below the fold where
          nobody could read it out for a support conversation. */}
      <Text style={styles.version}>{t('settings.version')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  content: { padding: SPACING.md, gap: SPACING.md },
  // Portrait: single column; landscape: row of two equal columns
  columns: { flexDirection: 'column', gap: SPACING.md },
  columnsLandscape: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xl },
  column: { gap: SPACING.md },
  columnLandscape: { flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  rowIcon: { fontSize: 24 },
  rowLabel: { flex: 1, fontFamily: FONTS.body, fontSize: 16, color: COLORS.ink },
  divider: { height: 1, backgroundColor: COLORS.line },
  statsCard: { flexDirection: 'row', paddingVertical: SPACING.md, gap: SPACING.md },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.ink },
  statLabel: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.inkSoft },
  gameStat: { fontFamily: FONTS.bodySemi, fontSize: 15, color: COLORS.inkSoft },
  emptyRow: { paddingVertical: SPACING.md },
  section: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: -SPACING.sm,
  },
  bands: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  version: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.inkFaint,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
});
