// Lulu's wardrobe — dress Lulu in what levels unlock (hats, glasses) and browse
// the sticker collection. Opening it clears the "new sticker" marks.
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { AppBar, Chip, EmojiImage, Icon } from '../components/common';
import { LevelPill, PopBackdrop, ProgressBar } from '../components/pop';
import {
  ALL_STICKERS,
  Lulu3D,
  OUTFITS,
  STARS_PER_STICKER,
  STICKER_SETS,
  Sticker,
  isUnlocked,
  levelInfo,
  markStickersSeen,
  stickerId,
  useRewards,
  useTranslation,
  useWearing,
  wear,
  type Outfit,
  type OutfitSlot,
} from '@/sdk';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Wardrobe'>;
type Tab = OutfitSlot | 'stickers';

const STICKER_SIZE = 58;
// Fixed, varied tilts so the page looks hand-stuck but never reshuffles.
const TILTS = [-6, 4, -2, 7, -4, 3];

export function WardrobeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const rewards = useRewards();
  const wearing = useWearing();
  const focused = useIsFocused();
  const [tab, setTab] = useState<Tab>('hat');
  const { level } = levelInfo(rewards.stars);

  // Leaving the wardrobe means the child has seen their new stickers.
  useEffect(() => () => void markStickersSeen(), []);

  const toggle = (o: Outfit) => {
    if (!isUnlocked(o, level)) return;
    void wear(o.slot, wearing[o.slot] === o.id ? null : o.id);
  };

  const items = tab === 'stickers' ? [] : OUTFITS.filter((o) => o.slot === tab);
  const owned = new Set(rewards.stickers);
  const unseen = new Set(rewards.unseen);

  return (
    <View style={styles.flex}>
      <PopBackdrop color={POP.bubblegum} stripe="#FF66B0" />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <AppBar
          title={t('wardrobe.title')}
          titleColor={COLORS.surface}
          onBack={() => navigation.goBack()}
          right={<LevelPill stars={rewards.stars} />}
        />
        <View style={styles.body}>
          <View style={styles.stage}>
            <Lulu3D size={210} mood="wave" interactive active={focused} />
            <View style={styles.shadow} />
          </View>

          <View style={[styles.panel, SHADOWS.lg]}>
            <View style={styles.tabs}>
              <Chip label={t('wardrobe.hats')} active={tab === 'hat'} onPress={() => setTab('hat')} />
              <Chip label={t('wardrobe.glasses')} active={tab === 'glasses'} onPress={() => setTab('glasses')} />
              <Chip label={t('wardrobe.stickers')} active={tab === 'stickers'} onPress={() => setTab('stickers')} />
              {unseen.size > 0 ? <View style={styles.newDot} /> : null}
            </View>

            {tab === 'stickers' ? (
              <ScrollView contentContainerStyle={styles.stickerList}>
                <View style={styles.nextRow}>
                  <Text style={styles.count}>
                    {t('stickers.count', { have: rewards.stickers.length, total: ALL_STICKERS.length })}
                  </Text>
                  <ProgressBar
                    value={(rewards.stars % STARS_PER_STICKER) / STARS_PER_STICKER}
                    color={COLORS.gold}
                    style={styles.flex}
                  />
                </View>
                <View style={styles.stickerGrid}>
                  {(Object.keys(STICKER_SETS) as (keyof typeof STICKER_SETS)[]).flatMap((set) =>
                    STICKER_SETS[set].map((_, i) => {
                      const id = stickerId(set, i);
                      const has = owned.has(id);
                      return (
                        <View
                          key={id}
                          style={styles.slot}
                          accessible
                          accessibilityLabel={has ? undefined : t('stickers.locked')}
                        >
                          <Sticker id={id} size={STICKER_SIZE} locked={!has} tilt={TILTS[i % TILTS.length]} />
                          {unseen.has(id) ? (
                            <View style={styles.newBadge}>
                              <Text style={styles.newText}>{t('stickers.newBadge')}</Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    }),
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.grid}>
                {items.map((o) => {
                  const open = isUnlocked(o, level);
                  const on = wearing[o.slot] === o.id;
                  const name = t(`wardrobe.items.${o.id}`);
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() => toggle(o)}
                      disabled={!open}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on, disabled: !open }}
                      accessibilityLabel={open ? name : `${name}, ${t('wardrobe.unlockAt', { n: o.level })}`}
                      style={({ pressed }) => [
                        styles.tile,
                        open ? (on ? styles.tileOn : SHADOWS.sm) : styles.tileLocked,
                        pressed && open && styles.pressed,
                      ]}
                    >
                      {open ? (
                        <>
                          <EmojiImage emoji={o.emoji} size={46} />
                          <Text style={styles.tileName} numberOfLines={1}>
                            {on ? t('wardrobe.wearing') : name}
                          </Text>
                          {on ? (
                            <View style={styles.tick}>
                              <Icon name="checkmark" size={14} />
                            </View>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <Icon name="lock-closed" size={24} color={COLORS.inkFaint} />
                          <Text style={styles.lockText}>{t('wardrobe.unlockAt', { n: o.level })}</Text>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flex: 1, flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  stage: { width: 240, alignItems: 'center', justifyContent: 'center' },
  shadow: { width: 170, height: 16, borderRadius: 8, backgroundColor: 'rgba(27,27,47,0.18)', marginTop: -10 },
  panel: {
    flex: 1,
    padding: 12,
    gap: 12,
    borderRadius: 24,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  tabs: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  newDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: POP.bubblegum,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    // Explicit: Android keeps a previous 'dashed' if the style just drops it,
    // and every tile starts locked until the rewards load.
    borderStyle: 'solid',
    width: 104,
    height: 96,
    borderRadius: 18,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: ACCENTS.purple.tint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileOn: { backgroundColor: '#FFF6C2', borderWidth: OUTLINE.thick, borderColor: POP.grape },
  tileLocked: { backgroundColor: '#ECE9F5', borderStyle: 'dashed', borderColor: COLORS.inkFaint },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  tileName: { fontFamily: FONTS.bodyExtra, fontSize: 12, color: COLORS.ink },
  tick: {
    position: 'absolute',
    top: -8,
    end: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: ACCENTS.green.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: { fontFamily: FONTS.bodyExtra, fontSize: 12, color: COLORS.inkSoft },
  stickerList: { gap: 10, paddingBottom: 8 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, direction: 'ltr' },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: STICKER_SIZE + 8, height: STICKER_SIZE + 8, alignItems: 'center', justifyContent: 'center' },
  newBadge: {
    position: 'absolute',
    top: -4,
    end: -6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
  },
  newText: { fontFamily: FONTS.display, fontSize: 11, color: COLORS.ink },
});
