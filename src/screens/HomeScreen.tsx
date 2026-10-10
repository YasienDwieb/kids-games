import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, GameConfig } from '../types';
import { Chip, GameCard, Icon, IconButton, PressableButton } from '../components/common';
import { FeaturedCard, LevelPill, PopBackdrop, QuestCard } from '../components/pop';
import { isTablet } from '../utils/responsive';
import { BORDER_RADIUS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING } from '../constants';
import type { AccentName } from '../constants';
import {
  useSettings,
  useLanguage,
  LANGUAGES,
  GAME_CATEGORIES,
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
  doneCounts,
  firstOpenStep,
  DEFAULT_FLOW_PROGRESS,
  type FlowProgress,
  type GameCategory,
  Lulu3D,
  useRewards,
  useQuests,
} from '@/sdk';
import { reloadApp } from '@/sdk/i18n/reload';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ACCENT_CYCLE: AccentName[] = ['green', 'blue', 'orange', 'coral', 'purple', 'pink'];

// Stable fallback accent when a game config doesn't declare one.
function accentForGame(game: GameConfig, index: number): AccentName {
  return game.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length];
}

// Layout tokens (landscape).
const PAD = 14;
const GAP = 10;
const TILE_GAP = 18;
const TOP_BAR_H = 52;
const CHIPS_H = 54;
const CARD_MIN_H = 92;
const LULU_MIN = 64;
const LULU_MAX = 160;

export function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const landscape = width > height;
  const { settings, update } = useSettings();
  const rewards = useRewards();
  const questDay = useQuests();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  // Language switching restarts the app, so it asks first. That confirmation is
  // also what keeps it safe to leave ungated: a parent passes it in one tap, a
  // toddler tapping around does not.
  const [pendingLang, setPendingLang] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [category, setCategory] = useState<GameCategory | null>(null);
  const [luluBox, setLuluBox] = useState(0);
  // Measured, not derived from insets: system bars differ per device and the
  // rail must fill exactly what's left above the chips.
  const [railBox, setRailBox] = useState(0);
  const railRef = useRef<ScrollView>(null);

  // Games shown on Home are filtered by the parent-set age band (Settings).
  const visible = settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames();
  const categories = GAME_CATEGORIES.filter((c) => visible.some((g) => g.category === c));
  const games = category ? visible.filter((g) => g.category === category) : visible;

  // --- Guided adventure (the featured card) ---
  const adapters = selectedAdapters(settings.flowGameIds);
  const journeyTotal = sequenceLength(adapters);
  const [savedFlow, setSavedFlow] = useState<FlowProgress>(DEFAULT_FLOW_PROGRESS);
  const flowStore = useMemo(() => createFlowProgressStore(), []);
  // Re-read the checkpoint each time Home regains focus so the card reflects
  // progress made (or completion) inside the journey before returning here.
  // Lulu's GL surface comes back blank after another screen covered Home, so
  // she is remounted each time Home becomes focused again.
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    if (focused) setVisit((v) => v + 1);
  }, [focused]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      flowStore.get().then((p) => {
        if (active) setSavedFlow(p);
      });
      return () => {
        active = false;
      };
    }, [flowStore]),
  );

  // Progress is counted per game, so it stays right when the journey's game
  // list changes (an update adds a game, a parent toggles one in Settings).
  const sequence = journeyTotal > 0 ? buildSequence(adapters) : [];
  const done = doneCounts(sequence, savedFlow);
  const savedStep = sequence.filter((s) => s.localIndex < (done[s.gameId] ?? 0)).length;
  const nextStep = sequence[Math.min(firstOpenStep(sequence, done), sequence.length - 1)];
  const nextGame = nextStep ? getGame(nextStep.gameId) : undefined;

  const startOver = () => {
    const fresh: FlowProgress = {
      step: 0,
      seed: 0,
      updatedAt: Date.now(),
      done: {},
    };
    flowStore.set(fresh).then(() => {
      setSavedFlow(fresh);
      navigation.navigate('FlowPlayer');
    });
  };

  const openGame = (id: string) => navigation.navigate('GamePlayer', { gameId: id });

  // --- Top bar ---
  // Sound and language live here, not behind the parent gate: muting is the
  // most urgent control in the app and both are trivially reversible.
  const otherLang = LANGUAGES.find((l) => l.code !== language) ?? LANGUAGES[0];
  const compactBar = width < 700;

  const starsPill = (
    <Pressable
      onPress={() => navigation.navigate('Wardrobe')}
      accessibilityRole="button"
      accessibilityLabel={t('home.wardrobeA11y', { n: rewards.stars })}
      hitSlop={6}
      style={({ pressed }) => [styles.starsPill, pressed ? styles.pressed : SHADOWS.sm]}
    >
      <Text style={styles.starGlyph}>★</Text>
      <Text style={styles.starsText}>{rewards.stars}</Text>
      {rewards.unseen.length > 0 ? <View style={styles.newDot} /> : null}
    </Pressable>
  );

  const topBar = (
    <View style={styles.topBar}>
      <LevelPill stars={rewards.stars} compact={compactBar} onPress={() => navigation.navigate('Quests')} />
      {starsPill}
      <View style={styles.flex} />
      <IconButton
        onPress={() => update({ soundEnabled: !settings.soundEnabled })}
        accessibilityLabel={t(settings.soundEnabled ? 'home.muteOn' : 'home.muteOff')}
      >
        <Icon name={settings.soundEnabled ? 'volume-high' : 'volume-mute'} size={24} />
      </IconButton>
      <IconButton
        glyph={otherLang.code === 'ar' ? 'ع' : 'EN'}
        glyphSize={otherLang.code === 'ar' ? 22 : 16}
        onPress={() => setPendingLang(otherLang.code)}
        accessibilityLabel={t('home.changeLanguage')}
      />
      <IconButton onPress={() => navigation.navigate('Settings')} accessibilityLabel={t('home.grownUps')}>
        <Icon name="settings-sharp" size={22} />
      </IconButton>
    </View>
  );

  const chips =
    categories.length > 1 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t('home.categories.all')} active={category === null} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c}
            label={t(`home.categories.${c}`)}
            active={category === c}
            onPress={() => setCategory(category === c ? null : c)}
          />
        ))}
      </ScrollView>
    ) : null;

  const quests = <QuestCard quests={questDay.quests} onPress={() => navigation.navigate('Quests')} />;

  // Tap Lulu to say hi (she hops and giggles), drag sideways to spin her.
  const luluSize = Math.max(0, Math.min(LULU_MAX, luluBox));
  const lulu =
    luluSize >= LULU_MIN ? (
      <Lulu3D key={visit} size={luluSize} interactive active={focused} style={styles.lulu} />
    ) : null;

  const featured = (w: number, h: number) => (
    <FeaturedCard
      width={w}
      height={h}
      total={journeyTotal}
      savedStep={savedStep}
      nextIcon={nextGame?.icon}
      nextName={nextGame ? gameName(nextGame) : undefined}
      nextAccent={nextGame?.accent}
      onPlay={() => navigation.navigate('FlowPlayer')}
      onStartOver={startOver}
      onSetup={() => navigation.navigate('Settings')}
    />
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
      <View style={[styles.dialog, SHADOWS.lg]}>
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
        <Icon name="globe-outline" size={64} />
        <Text style={styles.switchText}>{t('settings.switching')}</Text>
      </SafeAreaView>
    );
  }

  const empty = <Text style={styles.empty}>{t('home.empty')}</Text>;

  if (landscape) {
    // Body under the top bar: a quests + Lulu column, then one horizontal rail
    // that opens with the featured card and continues into the game tiles.
    const leftW = Math.round(Math.max(196, Math.min(260, width * 0.25)));
    // Until the rail is measured, estimate it from the window so the first
    // frame already lays out (and tests, which never fire onLayout, render it).
    const railEstimate =
      height - insets.top - insets.bottom - PAD * 2 - TOP_BAR_H - GAP - (chips ? CHIPS_H + GAP : 0);
    const railH = Math.max(CARD_MIN_H, (railBox || railEstimate) - 8); // room for the hard shadow
    const rows = railH >= CARD_MIN_H * 2 + TILE_GAP ? 2 : 1;
    const cardH = Math.floor((railH - TILE_GAP * (rows - 1)) / rows);
    const cardW = Math.round(Math.max(112, Math.min(150, cardH * 0.9)));
    const emoji = Math.round(Math.max(30, Math.min(56, cardH * 0.34)));
    const featW = Math.round(Math.max(230, Math.min(360, railH * 1.2)));

    return (
      <View style={styles.safe}>
        <PopBackdrop color={POP.zap} stripe={POP.zapDeep} />
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.page}>
            {topBar}
            <View style={styles.body}>
              <View style={[styles.left, { width: leftW }]}>
                {quests}
                <View
                  style={styles.luluBox}
                  onLayout={(e: LayoutChangeEvent) =>
                    setLuluBox(Math.floor(Math.min(e.nativeEvent.layout.height, e.nativeEvent.layout.width)))
                  }
                >
                  {lulu}
                </View>
              </View>

              <View style={styles.flex}>
                <View
                  style={styles.flex}
                  onLayout={(e: LayoutChangeEvent) => setRailBox(Math.floor(e.nativeEvent.layout.height))}
                >
                  <ScrollView
                    ref={railRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.rail}
                    contentContainerStyle={styles.railContent}
                    // The rail mirrors natively under RTL, but a horizontal
                    // ScrollView still starts at x:0 (the far end). Snap to the
                    // reading start once the content is measured.
                    onContentSizeChange={(w) => {
                      if (I18nManager.isRTL) railRef.current?.scrollTo({ x: w, animated: false });
                    }}
                  >
                    {category === null ? featured(featW, railH) : null}
                    {games.length === 0 ? (
                      empty
                    ) : (
                      <View style={[styles.grid, { height: railH }]}>
                        {games.map((game, i) => (
                          <View key={game.id} style={{ width: cardW, height: cardH }}>
                            <GameCard
                              fill
                              emojiSize={emoji}
                              icon={game.icon}
                              // Short label so the icon gets the space; the full
                              // name still goes to screen readers.
                              name={gameShortName(game)}
                              accessibilityLabel={gameName(game)}
                              accent={accentForGame(game, i)}
                              onPress={() => openGame(game.id)}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                </View>
                {chips ? <View style={styles.chipsRow}>{chips}</View> : null}
              </View>
            </View>
          </View>
        </SafeAreaView>
        {languageDialog}
      </View>
    );
  }

  // Portrait fallback: stacked, with a wrapping grid.
  const columns = isTablet(width, height) ? (width > 900 ? 4 : 3) : 2;
  const contentW = width - insets.left - insets.right - PAD * 2;
  return (
    <View style={styles.safe}>
      <PopBackdrop color={POP.zap} stripe={POP.zapDeep} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.portrait}>
          {topBar}
          {featured(contentW, 300)}
          <View style={styles.portraitRow}>
            <View style={styles.flex}>{quests}</View>
            <Lulu3D key={visit} size={130} interactive active={focused} />
          </View>
          {chips}
          {games.length === 0 ? (
            empty
          ) : (
            <View style={styles.wrapGrid}>
              {games.map((game, i) => (
                <View key={game.id} style={{ width: (contentW - GAP * (columns - 1)) / columns }}>
                  <GameCard
                    icon={game.icon}
                    name={gameName(game)}
                    accent={accentForGame(game, i)}
                    onPress={() => openGame(game.id)}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      {languageDialog}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: POP.zap },
  flex: { flex: 1 },
  page: { flex: 1, padding: PAD, gap: GAP },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },

  topBar: {
    height: TOP_BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  starsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  starGlyph: { fontSize: 24, lineHeight: 28, color: COLORS.gold },
  starsText: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.ink,
    direction: 'ltr',
  },
  newDot: {
    position: 'absolute',
    top: -4,
    end: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: POP.bubblegum,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
  },

  body: { flex: 1, flexDirection: 'row', gap: GAP + 4 },
  left: { gap: GAP },
  luluBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lulu: { alignSelf: 'center' },

  // The rail clips nothing: hard shadows and the press offset need the room.
  rail: { flexGrow: 0, overflow: 'visible' },
  railContent: {
    gap: TILE_GAP + 6,
    paddingEnd: 8,
    paddingBottom: 6,
    alignItems: 'flex-start',
  },
  // Column-major grid: overflow flows into new columns reached by sideways scroll.
  grid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: TILE_GAP,
  },
  chipsRow: { height: CHIPS_H, marginTop: GAP, justifyContent: 'center' },
  chips: {
    gap: SPACING.sm,
    paddingEnd: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },

  empty: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
    textAlign: 'center',
    padding: 40,
  },

  portrait: { padding: PAD, gap: 14, paddingBottom: 40 },
  portraitRow: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  wrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },

  dialogScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  dialog: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    padding: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'center',
    maxWidth: 440,
  },
  dialogTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.ink,
    textAlign: 'center',
  },
  dialogBody: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  dialogRow: { flexDirection: 'row', gap: SPACING.sm },
  dialogBtn: { minWidth: 130 },
  switchScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  switchText: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink },
});
