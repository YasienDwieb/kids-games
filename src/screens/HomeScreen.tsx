import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, GameConfig } from '../types';
import { GameCard, Chip, IconButton, HoldToConfirm } from '../components/common';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants';
import type { AccentName } from '../constants';
import {
  useSettings,
  gamesForBand,
  getGame,
  getAllGames,
  AGE_BANDS,
  bandsForGame,
  useTranslation,
  gameName,
  PressableButton,
  selectedAdapters,
  sequenceLength,
  createFlowProgressStore,
} from '@/sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ACCENT_CYCLE: AccentName[] = ['green', 'blue', 'orange', 'coral', 'purple', 'pink'];

// Stable fallback accent when a game config doesn't declare one.
function accentForGame(game: GameConfig, index: number): AccentName {
  return game.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length];
}

function ageBandIdForGame(game: GameConfig): string | undefined {
  const ids = bandsForGame(game);
  return AGE_BANDS.find((b) => ids.includes(b.id))?.id;
}

// Landscape rail layout tokens.
const SIDEBAR_W = 208;
const GRID_PAD_V = 14;
const GRID_PAD_H = 12;
const CELL_GAP = 12;

export function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  const columns = 2; // portrait grid columns
  const { settings, update } = useSettings();
  const { t } = useTranslation();
  const games = settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames();

  const adapters = selectedAdapters(settings.flowGameIds);
  const journeyTotal = sequenceLength(adapters);
  const includedIcons = adapters
    .map((a) => getGame(a.gameId)?.icon)
    .filter((icon): icon is string => Boolean(icon));

  const [savedStep, setSavedStep] = useState(0);
  const flowStore = useMemo(() => createFlowProgressStore(), []);
  // Re-read the checkpoint each time Home regains focus so the card reflects
  // progress made (or completion) inside the journey before returning here.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      flowStore
        .get()
        .then((p) => {
          if (active) setSavedStep(p.step);
        });
      return () => {
        active = false;
      };
    }, [flowStore]),
  );

  const journeyDone = journeyTotal > 0 && savedStep >= journeyTotal;

  const resetJourney = () => {
    flowStore
      .set({ step: 0, seed: 0, updatedAt: Date.now() })
      .then(() => setSavedStep(0));
  };

  const settingsButton = (
    <IconButton
      glyph="⚙️"
      onPress={() => navigation.navigate('Settings')}
      accessibilityLabel={t('settings.title')}
    />
  );

  const modeSwitch = (style?: object) => (
    <View style={[styles.switchRow, style]}>
      <Pressable
        onPress={() => update({ mode: 'guided' })}
        style={[styles.segment, settings.mode === 'guided' && styles.segmentOn]}
        accessibilityRole="button"
        accessibilityState={{ selected: settings.mode === 'guided' }}
      >
        <Text style={[styles.segmentText, settings.mode === 'guided' && styles.segmentTextOn]}>
          {t('flow.switchJourney')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => update({ mode: 'free' })}
        style={[styles.segment, settings.mode === 'free' && styles.segmentOn]}
        accessibilityRole="button"
        accessibilityState={{ selected: settings.mode === 'free' }}
      >
        <Text style={[styles.segmentText, settings.mode === 'free' && styles.segmentTextOn]}>
          {t('flow.switchGames')}
        </Text>
      </Pressable>
    </View>
  );

  // Age chips: a horizontal scroller in portrait, a wrapping cluster in the sidebar.
  const ageChips = settings.mode !== 'guided' && (
    <>
      <Chip
        label={t('home.all')}
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
    </>
  );

  const journeyPane = (
    <View style={[styles.journey, landscape && styles.journeyLandscape]}>
      <Text style={styles.journeyTitle}>{t('flow.title')}</Text>
      {journeyTotal === 0 ? (
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel={t('flow.empty')}
        >
          <Text style={styles.journeyEmpty}>{t('flow.empty')}</Text>
        </Pressable>
      ) : (
        <>
          {journeyDone ? (
            <Text style={styles.journeyDone}>{t('flow.allCaughtUp')}</Text>
          ) : (
            <PressableButton
              label={savedStep > 0 ? t('flow.continue') : t('flow.start')}
              accent="purple"
              onPress={() => navigation.navigate('FlowPlayer')}
            />
          )}
          {includedIcons.length > 0 && (
            <Pressable
              style={styles.strip}
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel={t('flow.includedGames')}
            >
              <Text style={styles.stripLabel}>{t('flow.includedGames')}</Text>
              <View style={styles.stripIcons}>
                {includedIcons.map((icon, i) => (
                  <Text key={`${icon}-${i}`} style={styles.stripIcon}>
                    {icon}
                  </Text>
                ))}
              </View>
            </Pressable>
          )}
          <HoldToConfirm
            label={t('flow.holdToReset')}
            accent="coral"
            onConfirm={resetJourney}
            style={styles.reset}
          />
        </>
      )}
    </View>
  );

  const gamesGrid =
    games.length === 0 ? (
      <Text style={styles.empty}>{t('home.empty')}</Text>
    ) : (
      <View style={styles.grid}>
        {games.map((game, i) => {
          const bandId = ageBandIdForGame(game);
          return (
            <View key={game.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
              <GameCard
                icon={game.icon}
                name={gameName(game)}
                accent={accentForGame(game, i)}
                ageLabel={bandId ? t(`ageBands.${bandId}`) : undefined}
                onPress={() => navigation.navigate('GamePlayer', { gameId: game.id })}
              />
            </View>
          );
        })}
      </View>
    );

  const mainPane = settings.mode === 'guided' ? journeyPane : gamesGrid;

  // Landscape rail metrics: pick a row count that fills the available height,
  // size cells to it, and pack games column-major so overflow flows into new
  // columns reached by HORIZONTAL scroll (never vertical).
  const railUsableH = height - insets.top - insets.bottom - GRID_PAD_V * 2;
  const railRows = Math.max(1, Math.min(3, Math.round(railUsableH / 200)));
  const railCardH = Math.floor(railUsableH / railRows) - CELL_GAP;
  const railCardW = Math.max(116, Math.min(160, Math.round(railCardH * 0.82)));
  const railEmoji = Math.max(30, Math.min(54, Math.round(railCardH * 0.3)));

  const gamesRail =
    games.length === 0 ? (
      <View style={[styles.mainPane, styles.mainPaneContent]}>
        <Text style={styles.empty}>{t('home.empty')}</Text>
      </View>
    ) : (
      <ScrollView
        horizontal
        style={styles.mainPane}
        contentContainerStyle={styles.rail}
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.railGrid, { height: railUsableH }]}>
          {games.map((game, i) => {
            const bandId = ageBandIdForGame(game);
            return (
              <View
                key={game.id}
                style={{ width: railCardW, height: railCardH, margin: CELL_GAP / 2 }}
              >
                <GameCard
                  fill
                  emojiSize={railEmoji}
                  icon={game.icon}
                  name={gameName(game)}
                  accent={accentForGame(game, i)}
                  ageLabel={bandId ? t(`ageBands.${bandId}`) : undefined}
                  onPress={() => navigation.navigate('GamePlayer', { gameId: game.id })}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    );

  // Landscape: a fixed-width sidebar (greeting + controls) beside a games rail
  // that fills the height — so the layout uses the wide-but-short viewport
  // instead of stacking the portrait column and scrolling it vertically.
  if (landscape) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.twoPane}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.flexShrink}>
                <Text style={styles.hello}>{t('home.greeting')}</Text>
                <Text style={[styles.title, styles.titleSidebar]}>{t('home.title')}</Text>
              </View>
              {settingsButton}
            </View>
            {modeSwitch()}
            {settings.mode !== 'guided' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sidebarChips}
              >
                {ageChips}
              </ScrollView>
            )}
          </View>
          {settings.mode === 'guided' ? (
            <ScrollView
              style={styles.mainPane}
              contentContainerStyle={styles.mainPaneContent}
              showsVerticalScrollIndicator={false}
            >
              {journeyPane}
            </ScrollView>
          ) : (
            gamesRail
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* greeting header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>{t('home.greeting')}</Text>
            <Text style={styles.title}>{t('home.title')}</Text>
          </View>
          {settingsButton}
        </View>

        {/* Journey / Games mode switch */}
        {modeSwitch(styles.switchRowPortrait)}

        {/* Free-play age chips (only in games mode) */}
        {settings.mode !== 'guided' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {ageChips}
          </ScrollView>
        )}

        {/* Journey card or game grid */}
        {mainPane}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  scroll: { paddingBottom: SPACING.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  hello: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 34,
    color: COLORS.ink,
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
  },
  cell: {
    padding: 7,
  },
  empty: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLORS.inkSoft,
    textAlign: 'center',
    paddingVertical: 40,
  },
  journey: {
    paddingHorizontal: 22,
    paddingTop: 24,
    gap: SPACING.lg,
    alignItems: 'center',
  },
  journeyTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.ink,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.pill,
  },
  switchRowPortrait: {
    marginHorizontal: 22,
    marginTop: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
  },
  segmentOn: { backgroundColor: COLORS.brand },
  segmentText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: COLORS.inkSoft },
  segmentTextOn: { color: COLORS.surface },
  journeyEmpty: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
    textAlign: 'center',
    paddingVertical: 24,
  },
  journeyDone: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: COLORS.ink,
    textAlign: 'center',
    paddingVertical: 12,
  },
  strip: { alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  stripLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.inkSoft },
  stripIcons: { flexDirection: 'row', gap: SPACING.sm },
  stripIcon: { fontSize: 28 },
  reset: { marginTop: SPACING.sm, alignSelf: 'stretch' },
  journeyLandscape: {
    maxWidth: 480,
    alignSelf: 'center',
  },
  // --- Landscape two-pane ---
  twoPane: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_W,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  flexShrink: { flexShrink: 1 },
  titleSidebar: {
    fontSize: 26,
  },
  sidebarChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    paddingBottom: SPACING.xs,
  },
  mainPane: {
    flex: 1,
  },
  mainPaneContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  // Horizontal games rail: a column-major grid that fills the height.
  rail: {
    paddingHorizontal: GRID_PAD_H,
    alignItems: 'center',
    flexGrow: 1,
  },
  railGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
  },
});
