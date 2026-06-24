import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export function HomeScreen({ navigation }: Props) {
  const { settings, update } = useSettings();
  const { t } = useTranslation();
  const games = settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames();

  const adapters = selectedAdapters(settings.flowGameIds);
  const journeyTotal = sequenceLength(adapters);
  const includedIcons = adapters
    .map((a) => getGame(a.gameId)?.icon)
    .filter((icon): icon is string => Boolean(icon));

  const [savedStep, setSavedStep] = useState(0);
  // Re-read the checkpoint each time Home regains focus so the card reflects
  // progress made (or completion) inside the journey before returning here.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      createFlowProgressStore()
        .get()
        .then((p) => {
          if (active) setSavedStep(p.step);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const journeyDone = journeyTotal > 0 && savedStep >= journeyTotal;

  const resetJourney = () => {
    createFlowProgressStore()
      .set({ step: 0, seed: 0, updatedAt: Date.now() })
      .then(() => setSavedStep(0));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* greeting header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>{t('home.greeting')}</Text>
            <Text style={styles.title}>{t('home.title')}</Text>
          </View>
          <IconButton
            glyph="⚙️"
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel={t('settings.title')}
          />
        </View>

        {/* Journey / Games mode switch */}
        <View style={styles.switchRow}>
          <Pressable
            onPress={() => update({ mode: 'guided' })}
            style={[styles.segment, settings.mode === 'guided' && styles.segmentOn]}
          >
            <Text
              style={[styles.segmentText, settings.mode === 'guided' && styles.segmentTextOn]}
            >
              {t('flow.switchJourney')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => update({ mode: 'free' })}
            style={[styles.segment, settings.mode === 'free' && styles.segmentOn]}
          >
            <Text
              style={[styles.segmentText, settings.mode === 'free' && styles.segmentTextOn]}
            >
              {t('flow.switchGames')}
            </Text>
          </Pressable>
        </View>

        {/* Free-play age chips (only in games mode) */}
        {settings.mode !== 'guided' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
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
          </ScrollView>
        )}

        {/* Journey card or game grid */}
        {settings.mode === 'guided' ? (
          <View style={styles.journey}>
            <Text style={styles.journeyTitle}>{t('flow.title')}</Text>
            {journeyTotal === 0 ? (
              <Pressable onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.journeyEmpty}>{t('flow.empty')}</Text>
              </Pressable>
            ) : (
              <>
                {journeyDone ? (
                  <Text style={styles.journeyDone}>{t('flow.allCaughtUp')}</Text>
                ) : (
                  <PressableButton
                    label={t('flow.continue')}
                    accent="purple"
                    onPress={() => navigation.navigate('FlowPlayer')}
                  />
                )}
                {includedIcons.length > 0 && (
                  <Pressable
                    style={styles.strip}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Text style={styles.stripLabel}>{t('flow.includedGames')}</Text>
                    <View style={styles.stripIcons}>
                      {includedIcons.map((icon, i) => (
                        <Text key={i} style={styles.stripIcon}>
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
        ) : games.length === 0 ? (
          <Text style={styles.empty}>{t('home.empty')}</Text>
        ) : (
          <View style={styles.grid}>
            {games.map((game, i) => {
              const bandId = ageBandIdForGame(game);
              return (
                <View key={game.id} style={styles.cell}>
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
        )}
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
    width: '50%',
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
    marginHorizontal: 22,
    marginTop: 16,
    padding: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.pill,
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
});
