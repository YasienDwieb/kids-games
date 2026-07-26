import { useCallback, useMemo, useRef, useState } from 'react';
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
import { computeHomeGrid, isTablet, homeRailWidth } from '../utils/responsive';
import { COLORS, FONTS, SPACING } from '../constants';
import type { AccentName } from '../constants';
import {
  useSettings,
  useLanguage,
  LANGUAGES,
  getGame,
  getAllGames,
  gamesForBand,
  useTranslation,
  gameName,
  gameShortName,
  selectedAdapters,
  sequenceLength,
  buildSequence,
  createFlowProgressStore,
} from '@/sdk';
import { reloadApp } from '@/sdk/i18n/reload';
import { PressableButton } from '../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ACCENT_CYCLE: AccentName[] = ['green', 'blue', 'orange', 'coral', 'purple', 'pink'];

// Stable fallback accent when a game config doesn't declare one.
function accentForGame(game: GameConfig, index: number): AccentName {
  return game.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length];
}

// Layout tokens.
const GAMES_HEADER_H = 56; // height reserved for the settings control above the rail
const GRID_PAD_V = 14;
const GRID_PAD_H = 12;
const CELL_GAP = 12;

export function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  // Portrait grid columns: 2 on phones, 3–4 on tablets so it isn't two giant columns.
  const columns = isTablet(width, height) ? (width > 900 ? 4 : 3) : 2;
  const { settings, update } = useSettings();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  // Language switching restarts the app, so it asks first. That confirmation is
  // also what keeps it safe to leave ungated: a parent passes it in one tap, a
  // toddler tapping around does not.
  const [pendingLang, setPendingLang] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  // Games shown on Home are filtered by the parent-set age band ("Show games for"
  // in Settings); null = all. The old kid-facing age chips were removed from Home,
  // so this is now driven solely from Settings.
  const games = settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames();

  // --- Guided journey state (persistent card beside the games) ---
  const adapters = selectedAdapters(settings.flowGameIds);
  const journeyTotal = sequenceLength(adapters);
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

  // Sound and language live here, not behind the parent gate: muting is the
  // most urgent control in the app and both are trivially reversible, so making
  // a parent solve arithmetic for them was the wrong trade.
  const otherLang = LANGUAGES.find((l) => l.code !== language) ?? LANGUAGES[0];

  const soundButton = (
    <IconButton
      glyph={settings.soundEnabled ? '🔊' : '🔇'}
      onPress={() => update({ soundEnabled: !settings.soundEnabled })}
      accessibilityLabel={t(settings.soundEnabled ? 'home.muteOn' : 'home.muteOff')}
    />
  );

  const languageButton = (
    <IconButton
      glyph={otherLang.code === 'ar' ? 'ع' : 'EN'}
      glyphSize={otherLang.code === 'ar' ? 24 : 16}
      onPress={() => setPendingLang(otherLang.code)}
      accessibilityLabel={t('home.changeLanguage')}
    />
  );

  // No "All games" title: they are self-evidently games, and the heading cost a
  // full text row that a pre-reader gets nothing from.
  const gamesHeader = (
    <View style={styles.gamesHeader}>
      {soundButton}
      {languageButton}
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
  const grid = computeHomeGrid({
    width,
    height,
    count: games.length,
    insetsTop: insets.top,
    insetsBottom: insets.bottom,
  });
  const railCardW = grid.cardW;
  const railCardH = grid.cardH;
  const railEmoji = grid.emojiSize;

  const gameCells = games.map((game, i) => (
    <View key={game.id} style={{ width: railCardW, height: railCardH, margin: CELL_GAP / 2 }}>
      <GameCard
        fill
        emojiSize={railEmoji}
        icon={game.icon}
        // Short label so the icon gets the space; full name still goes to
        // screen readers.
        name={gameShortName(game)}
        accessibilityLabel={gameName(game)}
        accent={accentForGame(game, i)}
        onPress={() => navigation.navigate('GamePlayer', { gameId: game.id })}
      />
    </View>
  ));

  const gamesRail =
    games.length === 0 ? (
      <View style={[styles.mainPane, styles.mainPaneContent]}>
        <Text style={styles.empty}>{t('home.empty')}</Text>
      </View>
    ) : grid.scroll ? (
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
        <View style={[styles.railGrid, { height: railUsableH }]}>{gameCells}</View>
      </ScrollView>
    ) : (
      // Tablet fit-all: everything visible in a centered wrapping grid, no scroll.
      <View style={[styles.mainPane, styles.fitGrid]}>{gameCells}</View>
    );

  const confirmLanguage = async () => {
    if (!pendingLang) return;
    const target = pendingLang;
    setPendingLang(null);
    setSwitching(true);
    const { needsReload } = await changeLanguage(target as never);
    if (needsReload) reloadApp();
    else setSwitching(false);
  };

  // Rendered above everything so it reads as a decision, not a suggestion.
  const languageDialog = pendingLang ? (
    <View style={styles.dialogScrim}>
      <View style={styles.dialog}>
        <Text style={styles.dialogTitle}>{t('home.switchTitle')}</Text>
        <Text style={styles.dialogBody}>{t('home.switchBody')}</Text>
        <View style={styles.dialogRow}>
          <PressableButton
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => setPendingLang(null)}
            style={styles.dialogBtn}
          />
          {/* The button carries the target language rather than the title, so
              the two scripts never share a sentence and bidi cannot reorder the
              punctuation. It also states exactly what the tap produces. */}
          <PressableButton
            label={LANGUAGES.find((l) => l.code === pendingLang)?.label ?? String(pendingLang)}
            accent="purple"
            onPress={confirmLanguage}
            style={styles.dialogBtn}
          />
        </View>
      </View>
    </View>
  ) : null;

  if (switching) {
    return (
      <SafeAreaView style={[styles.safe, styles.switchScreen]} edges={['top', 'bottom']}>
        <Text style={styles.switchEmoji}>🌍</Text>
        <Text style={styles.switchText}>{t('settings.switching')}</Text>
      </SafeAreaView>
    );
  }

  // Landscape (primary): the journey rail and the games live side by side — no
  // mode toggle. The journey card fills its column; the games pane fills the rest.
  if (landscape) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.twoPane}>
          <View style={[styles.journeyPaneLandscape, { width: homeRailWidth(width, height) }]}>
            {journeyCard(false)}
          </View>
          <View style={styles.gamesPane}>
            {gamesHeader}
            {gamesRail}
          </View>
        </View>
        {languageDialog}
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
      {languageDialog}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  scroll: { paddingTop: SPACING.sm, paddingBottom: SPACING.xl },

  dialogScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  dialog: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'center',
    maxWidth: 420,
  },
  dialogTitle: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.ink,
    textAlign: 'center',
  },
  dialogBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  dialogRow: { flexDirection: 'row', gap: SPACING.sm },
  dialogBtn: { minWidth: 130 },
  switchScreen: { alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  switchEmoji: { fontSize: 56 },
  switchText: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink },
  gamesHeader: {
    height: GAMES_HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: 16,
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
    // width is applied inline via homeRailWidth(width, height) — 244 on phones,
    // wider on tablets.
    paddingLeft: 16,
    paddingVertical: GRID_PAD_V,
  },
  journeyPortrait: { marginHorizontal: 16, marginTop: 4, marginBottom: SPACING.xs },
  gamesPane: { flex: 1 },
  mainPane: { flex: 1 },
  // Tablet fit-all grid: center the wrapping cells in the games pane.
  fitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
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
