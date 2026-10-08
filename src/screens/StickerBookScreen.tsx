// Sticker book — every sticker the child has earned across all games, grouped by
// game, with the ones still to find shown as "?" slots. Opening it clears the
// "NEW" marks.
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { AppBar, EmojiImage, HudPill, hudTextStyle } from '../components/common';
import {
  ALL_STICKERS,
  Lulu3D,
  STARS_PER_STICKER,
  STICKER_SETS,
  Sticker,
  bestTextOn,
  gameName,
  getGame,
  markStickersSeen,
  stickerId,
  useRewards,
  useTranslation,
} from '@/sdk';
import { ACCENTS, BORDER_RADIUS, COLORS, FONT_SIZES, FONTS, SHADOWS, SPACING } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'StickerBook'>;

const STICKER_SIZE = 64;
// Fixed, varied tilts so the page looks hand-stuck but never reshuffles.
const TILTS = [-6, 4, -2, 7, -4, 3];

export function StickerBookScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const rewards = useRewards();
  const owned = new Set(rewards.stickers);
  const unseen = new Set(rewards.unseen);

  // Leaving the book means the child has seen what's new.
  useEffect(() => () => void markStickersSeen(), []);

  const total = ALL_STICKERS.length;
  const have = rewards.stickers.length;
  const toNext = STARS_PER_STICKER - (rewards.stars % STARS_PER_STICKER);
  const progress = (rewards.stars % STARS_PER_STICKER) / STARS_PER_STICKER;

  const sets = Object.keys(STICKER_SETS) as (keyof typeof STICKER_SETS)[];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar
        title={t('stickers.title')}
        onBack={() => navigation.goBack()}
        right={
          <HudPill>
            <Text style={hudTextStyle}>⭐ {rewards.stars}</Text>
          </HudPill>
        }
      />
      <View style={styles.body}>
        {/* Lulu + how close the next sticker is. */}
        <View style={[styles.side, SHADOWS.sm]}>
          <Lulu3D size={140} mood={have === total ? 'cheer' : 'wave'} interactive />
          <Text style={styles.count}>{t('stickers.count', { have, total })}</Text>
          {have < total ? (
            <>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.hint}>{t('stickers.nextIn', { n: toNext })}</Text>
            </>
          ) : (
            <Text style={styles.hint}>{t('stickers.complete')}</Text>
          )}
        </View>

        <ScrollView style={styles.pages} contentContainerStyle={styles.pagesContent}>
          {sets.map((set) => {
            const game = getGame(set);
            const title = game ? gameName(game) : t('stickers.general');
            return (
              <View key={set} style={[styles.page, SHADOWS.sm]}>
                <View style={styles.pageHeader}>
                  <EmojiImage emoji={game?.icon ?? '🎁'} size={26} />
                  <Text style={styles.pageTitle}>{title}</Text>
                </View>
                <View style={styles.row}>
                  {STICKER_SETS[set].map((_, i) => {
                    const id = stickerId(set, i);
                    const isOwned = owned.has(id);
                    return (
                      <View
                        key={id}
                        style={styles.slot}
                        accessible
                        accessibilityLabel={isOwned ? undefined : t('stickers.locked')}
                      >
                        <Sticker
                          id={id}
                          size={STICKER_SIZE}
                          locked={!isOwned}
                          tilt={TILTS[i % TILTS.length]}
                        />
                        {unseen.has(id) ? (
                          <View style={styles.newBadge}>
                            <Text style={styles.newText}>{t('stickers.newBadge')}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  body: { flex: 1, flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.md },
  side: {
    width: 220,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.surface,
  },
  count: { fontFamily: FONTS.displayBold, fontSize: FONT_SIZES.md, color: COLORS.ink },
  bar: {
    width: '100%',
    height: 14,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.canvas2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: BORDER_RADIUS.pill, backgroundColor: COLORS.gold },
  hint: { fontFamily: FONTS.bodySemi, fontSize: 15, color: COLORS.inkSoft, textAlign: 'center' },
  pages: { flex: 1 },
  pagesContent: { gap: SPACING.md, paddingBottom: SPACING.lg },
  page: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.surface,
  },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pageTitle: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  slot: { width: STICKER_SIZE + 8, height: STICKER_SIZE + 8, alignItems: 'center', justifyContent: 'center' },
  newBadge: {
    position: 'absolute',
    top: -4,
    end: -6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: ACCENTS.coral.deep,
  },
  newText: { fontFamily: FONTS.displayBold, fontSize: 11, color: bestTextOn(ACCENTS.coral.deep) },
});
