/**
 * "LEVEL UP!" — the big moment when lifetime stars cross into a new level.
 * Full-screen sunburst, the buddy jumping, the new level, and whatever wardrobe item
 * just unlocked with a try-it-on button. Closes by itself. Mounted inside CelebrationProvider,
 * so every play screen gets it.
 */
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { EmojiImage } from '@/components/common/EmojiImage';
import { Icon } from '@/components/common/Icon';
import { PressableButton } from '@/components/common/PressableButton';
import { Star } from '@/components/common/Star';
import { Sunburst } from '@/components/pop/Sunburst';
import { pulse, useLoop } from '@/components/pop/motion';
import { ACCENTS, COLORS, POP } from '@/constants/colors';
import { OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import { useSound } from '@/sdk/audio/useSound';
import { useBuddy } from '@/sdk/buddy';
import { BuddyFigure } from '@/sdk/mascot/BuddyFigure';
import { unlocksAt } from '@/sdk/player/outfits';
import { wear } from '@/sdk/player/outfitStore';
import { onLevelUp } from '@/sdk/rewards/store';
import { overlayClosed, overlayOpened } from '@/sdk/layout/overlayGate';
import { reserveVoice, voiceBusyRemaining } from '@/sdk/speech/voiceGate';

/** Let the win's own confetti land first. */
const SHOW_DELAY_MS = 1300;
/** How long the card stays up before it closes by itself. */
const CARD_MS = 4000;

export function LevelUp() {
  const { t } = useTranslation();
  // Read softly: the provider also renders outside a navigator (tests, previews).
  const navigation = useContext(NavigationContext);
  const { play } = useSound();
  const buddy = useBuddy();
  const [level, setLevel] = useState<number | null>(null);
  const enter = useMemo(() => new Animated.Value(0), []);
  const beat = useLoop(1100, { enabled: level != null });
  // Claim the overlay gate from the moment the level-up fires (not after the
  // delay), so the sticker toast and its voice wait until this card closes.
  const gated = useRef(false);
  const releaseGate = () => {
    if (!gated.current) return;
    gated.current = false;
    overlayClosed();
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onLevelUp((l) => {
      if (!gated.current) {
        gated.current = true;
        overlayOpened();
      }
      clearTimeout(timer);
      // Wait out the praise voice, and keep the next prompt off the jingle.
      const delay = Math.max(SHOW_DELAY_MS, voiceBusyRemaining());
      reserveVoice(delay + CARD_MS);
      timer = setTimeout(() => {
        setLevel(l);
        play('sfx.win', { haptic: true });
        enter.setValue(0);
        Animated.spring(enter, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
      }, delay);
    });
    return () => {
      off();
      clearTimeout(timer);
      releaseGate();
    };
  }, [enter, play]);

  useEffect(() => {
    if (level == null) return;
    const timer = setTimeout(() => {
      Animated.timing(enter, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setLevel(null);
        releaseGate();
      });
    }, CARD_MS);
    return () => clearTimeout(timer);
  }, [level, enter]);

  if (level == null) return null;
  const item = unlocksAt(level, buddy)[0];

  const tryOn = () => {
    if (item) void wear(item.slot, item.id);
    setLevel(null);
    releaseGate();
    // Typed loosely: this overlay lives in the SDK, outside the app's route types.
    (navigation as { navigate: (name: string) => void } | undefined)?.navigate('Wardrobe');
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: enter }]}>
      <View style={styles.burst} pointerEvents="none">
        <Sunburst color={ACCENTS.purple.base} size={1400} />
      </View>

      <Animated.View
        style={[styles.header, SHADOWS.md, pulse(beat, 0.06)]}
        accessible
        accessibilityLabel={`${t('levelUp.title')} ${t('levelUp.level', { n: level })}`}
      >
        <Star size={36} />
        <Star size={44} />
        <Star size={36} />
      </Animated.View>

      <View style={styles.middle}>
        <BuddyFigure size={200} mood="cheer" />

        {item ? (
          <View
            style={[styles.card, styles.unlock, SHADOWS.md]}
            accessible
            accessibilityLabel={`${t('levelUp.unlocked')} ${t(`wardrobe.items.${item.id}`)}`}
          >
            <View style={styles.itemWindow}>
              <EmojiImage emoji={item.emoji} size={48} />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {item && navigation ? (
          <PressableButton accessibilityLabel={t('levelUp.tryOn')} color={ACCENTS.green.base} onPress={tryOn}>
            <Icon name="shirt" size={30} />
          </PressableButton>
        ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 4,
    paddingHorizontal: 26,
    borderRadius: 18,
    borderWidth: OUTLINE.thick,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
  },
  middle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
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
