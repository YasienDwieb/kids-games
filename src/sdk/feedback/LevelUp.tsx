/**
 * "LEVEL UP!" — the big moment when lifetime stars cross into a new level.
 * Full-screen sunburst, Lulu jumping, the new level, and whatever wardrobe item
 * just unlocked with a "Try it on" button. Mounted inside CelebrationProvider,
 * so every play screen (and the quest board) gets it.
 */
import { useContext, useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { EmojiImage } from '@/components/common/EmojiImage';
import { PressableButton } from '@/components/common/PressableButton';
import { Sunburst } from '@/components/pop/Sunburst';
import { pulse, useLoop } from '@/components/pop/motion';
import { ACCENTS, COLORS, POP } from '@/constants/colors';
import { OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import { FONTS } from '@/constants/typography';
import { useSound } from '@/sdk/audio/useSound';
import { Lulu3D } from '@/sdk/mascot/Lulu3D';
import { unlocksAt } from '@/sdk/quests/outfits';
import { wear } from '@/sdk/quests/outfitStore';
import { onLevelUp } from '@/sdk/rewards/store';

/** Let the win's own confetti land first. */
const SHOW_DELAY_MS = 1300;

export function LevelUp() {
  const { t } = useTranslation();
  // Read softly: the provider also renders outside a navigator (tests, previews).
  const navigation = useContext(NavigationContext);
  const { play } = useSound();
  const [level, setLevel] = useState<number | null>(null);
  const enter = useMemo(() => new Animated.Value(0), []);
  const beat = useLoop(1100, { enabled: level != null });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onLevelUp((l) => {
      timer = setTimeout(() => {
        setLevel(l);
        play('sfx.win', { haptic: true });
        enter.setValue(0);
        Animated.spring(enter, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
      }, SHOW_DELAY_MS);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [enter, play]);

  if (level == null) return null;
  const item = unlocksAt(level)[0];

  const close = () => {
    Animated.timing(enter, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setLevel(null));
  };
  const tryOn = () => {
    if (item) void wear(item.slot, item.id);
    setLevel(null);
    // Typed loosely: this overlay lives in the SDK, outside the app's route types.
    (navigation as { navigate: (name: string) => void } | undefined)?.navigate('Wardrobe');
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: enter }]}>
      <View style={styles.burst} pointerEvents="none">
        <Sunburst color="#9877FF" size={1400} rays={12} />
      </View>

      <Animated.View style={[styles.header, SHADOWS.md, pulse(beat, 0.06)]}>
        <Text style={styles.headerText}>{t('levelUp.title')}</Text>
      </Animated.View>

      <View style={styles.middle}>
        <View style={[styles.card, SHADOWS.md]}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNum}>{level}</Text>
          </View>
          <Text style={styles.cardTitle}>{t('levelUp.level', { n: level })}</Text>
        </View>

        <Lulu3D size={200} mood="cheer" />

        {item ? (
          <View style={[styles.card, styles.unlock, SHADOWS.md]}>
            <Text style={styles.cardTitle}>{t('levelUp.unlocked')}</Text>
            <View style={styles.itemWindow}>
              <EmojiImage emoji={item.emoji} size={48} />
            </View>
            <Text style={styles.cardTitle}>{t(`wardrobe.items.${item.id}`)}</Text>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      <View style={styles.actions}>
        {item && navigation ? <PressableButton label={t('levelUp.tryOn')} variant="ghost" onPress={tryOn} /> : null}
        <PressableButton label={t('levelUp.keepPlaying')} color={ACCENTS.green.base} onPress={close} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: POP.grape,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    overflow: 'hidden',
    zIndex: 50,
  },
  burst: { position: 'absolute', top: '50%', left: '50%', marginTop: -700, marginLeft: -700 },
  header: {
    paddingVertical: 4,
    paddingHorizontal: 26,
    borderRadius: 18,
    borderWidth: OUTLINE.thick,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
  },
  headerText: { fontFamily: FONTS.display, fontSize: 40, color: COLORS.ink },
  middle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  spacer: { width: 200 },
  card: {
    width: 200,
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 22,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  unlock: { backgroundColor: POP.zap },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.grape,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: { fontFamily: FONTS.display, fontSize: 32, color: COLORS.surface },
  cardTitle: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink, textAlign: 'center' },
  itemWindow: {
    width: 76,
    height: 76,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: SPACING.md },
});
