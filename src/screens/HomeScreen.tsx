import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, GameConfig } from '../types';
import { GameCard, IconButton, JourneyCard } from '../components/common';
import { COLORS, FONTS, SPACING } from '../constants';
import type { AccentName } from '../constants';
import {
  useSettings,
  getGame,
  getAllGames,
  useTranslation,
  gameName,
  selectedAdapters,
  sequenceLength,
  buildSequence,
  createFlowProgressStore,
} from '@/sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ACCENT_CYCLE: AccentName[] = ['green', 'blue', 'orange', 'coral', 'purple', 'pink'];

// Stable fallback accent when a game config doesn't declare one.
function accentForGame(game: GameConfig, index: number): AccentName {
  return game.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length];
}

// Layout tokens.
const JOURNEY_W = 244; // landscape journey rail width
const GAMES_HEADER_H = 56; // height reserved for the "All games" header above the rail
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
  const games = getAllGames();

  // One-shot: clear any age band persisted by the old kid-facing chip filter so
  // Home isn't left silently filtered now that the chips are gone. (Seam: a future
  // child-profile feature drives game filtering from here instead.)
  useEffect(() => {
    if (settings.ageBand !== null) update({ ageBand: null });
  }, [settings.ageBand, update]);

  // --- Guided journey state (persistent card beside the games) ---
  const adapters = selectedAdapters(settings.flowGameIds);
  const journeyTotal = sequenceLength(adapters);
  const includedIcons = adapters
    .map((a) => getGame(a.gameId)?.icon)
    .filter((icon): icon is string => Boolean(icon));

  const railRef = useRef<ScrollView>(null);
  const [savedStep, setSavedStep] = useState(0);
  const flowStore = useMemo(() => createFlowProgressStore(), []);
  // Re-read the checkpoint each time Home regains focus so the card reflects
  // progress made (or completion) inside the journey before returning here.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      flowStore.get().then((p) => {
        if (active) setSavedStep(p.step);
      });
      return () => {
        active = false;
      };
    }, [flowStore]),
  );

  // The game whose unit comes next in the interleaved journey.
  const sequence = journeyTotal > 0 ? buildSequence(adapters) : [];
  const nextStep = sequence[Math.min(savedStep, sequence.length - 1)];
  const nextGame = nextStep ? getGame(nextStep.gameId) : undefined;

  const startOver = () => {
    flowStore.set({ step: 0, seed: 0, updatedAt: Date.now() }).then(() => {
      setSavedStep(0);
      navigation.navigate('FlowPlayer');
    });
  };

  const journeyCard = (compact: boolean) => (
    <JourneyCard
      total={journeyTotal}
      savedStep={savedStep}
      nextIcon={nextGame?.icon}
      nextName={nextGame ? gameName(nextGame) : undefined}
      nextAccent={nextGame?.accent}
      includedIcons={includedIcons}
      onContinue={() => navigation.navigate('FlowPlayer')}
      onStartOver={startOver}
      onSetup={() => navigation.navigate('Settings')}
      compact={compact}
      style={compact ? styles.journeyPortrait : undefined}
    />
  );

  const settingsButton = (
    <IconButton
      glyph="⚙️"
      onPress={() => navigation.navigate('Settings')}
      accessibilityLabel={t('settings.title')}
    />
  );

  const gamesHeader = (
    <View style={styles.gamesHeader}>
      <Text style={styles.gamesTitle}>{t('home.allGames')}</Text>
      {settingsButton}
    </View>
  );

  const gamesGrid =
    games.length === 0 ? (
      <Text style={styles.empty}>{t('home.empty')}</Text>
    ) : (
      <View style={styles.grid}>
        {games.map((game, i) => (
          <View key={game.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
            <GameCard
              icon={game.icon}
              name={gameName(game)}
              accent={accentForGame(game, i)}
              onPress={() => navigation.navigate('GamePlayer', { gameId: game.id })}
            />
          </View>
        ))}
      </View>
    );

  // Landscape rail metrics: pick a row count that fills the height under the
  // header, size cells to it, and pack games column-major so overflow flows into
  // new columns reached by HORIZONTAL scroll (never vertical).
  const railUsableH = height - insets.top - insets.bottom - GRID_PAD_V * 2 - GAMES_HEADER_H;
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
        ref={railRef}
        horizontal
        style={styles.mainPane}
        contentContainerStyle={styles.rail}
        showsHorizontalScrollIndicator={false}
        // The column-major grid mirrors natively under RTL: game 0 sits at the
        // content's RIGHT edge (largest x), beside the journey card. But the native
        // horizontal ScrollView initializes at x:0 (the LEFT edge = the last games),
        // leaving the rail "scrolled to the end". Once content is measured, scroll to
        // the right edge (x = full content width, clamped) so game 0 is flush first.
        onContentSizeChange={(w) => {
          if (I18nManager.isRTL) railRef.current?.scrollTo({ x: w, animated: false });
        }}
      >
        <View style={[styles.railGrid, { height: railUsableH }]}>
          {games.map((game, i) => (
            <View key={game.id} style={{ width: railCardW, height: railCardH, margin: CELL_GAP / 2 }}>
              <GameCard
                fill
                emojiSize={railEmoji}
                icon={game.icon}
                name={gameName(game)}
                accent={accentForGame(game, i)}
                onPress={() => navigation.navigate('GamePlayer', { gameId: game.id })}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );

  // Landscape (primary): the journey rail and the games live side by side — no
  // mode toggle. The journey card fills its column; the games pane fills the rest.
  if (landscape) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.twoPane}>
          <View style={styles.journeyPaneLandscape}>{journeyCard(false)}</View>
          <View style={styles.gamesPane}>
            {gamesHeader}
            {gamesRail}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Portrait fallback: journey card on top, then the games grid.
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {journeyCard(true)}
        {gamesHeader}
        {gamesGrid}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  scroll: { paddingTop: SPACING.sm, paddingBottom: SPACING.xl },

  gamesHeader: {
    height: GAMES_HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gamesTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    color: COLORS.ink,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 11,
  },
  cell: { padding: 7 },
  empty: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLORS.inkSoft,
    textAlign: 'center',
    paddingVertical: 40,
  },

  // --- Landscape two-pane ---
  twoPane: { flex: 1, flexDirection: 'row' },
  journeyPaneLandscape: {
    width: JOURNEY_W,
    paddingLeft: 16,
    paddingVertical: GRID_PAD_V,
  },
  journeyPortrait: { marginHorizontal: 16, marginTop: 4, marginBottom: SPACING.xs },
  gamesPane: { flex: 1 },
  mainPane: { flex: 1 },
  mainPaneContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  // Horizontal games rail: a column-major grid that fills the height. Mirrors
  // natively under RTL; the ScrollView's onContentSizeChange snaps the initial
  // offset to the RTL start so game 0 sits flush beside the journey card.
  rail: { paddingHorizontal: GRID_PAD_H, alignItems: 'center', flexGrow: 1 },
  railGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
  },
});
