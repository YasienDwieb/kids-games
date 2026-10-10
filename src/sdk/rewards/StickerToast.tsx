/**
 * "New sticker!" moment — when an award unlocks a sticker, Lulu pops up holding
 * it and says so (the same card announces reaching the daily goal). Rendered inside the CelebrationProvider overlay (above the
 * game, touch-transparent), so every game gets it for free.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSound } from '@/sdk/audio/useSound';
import { currentLanguage } from '@/sdk/i18n';
import { Mascot } from '@/sdk/mascot/Mascot';
import { COLORS } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZES, OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import { FONTS } from '@/constants/typography';
import { DAILY_GOAL, DAILY_GOAL_EVENT, onStickerUnlocked } from './store';
import { Sticker } from './Sticker';
import { whenOverlayClear } from '@/sdk/layout/overlayGate';
import { holdVoice } from '@/sdk/speech/voiceGate';

/** Let the win's own celebration land first. */
const SHOW_DELAY_MS = 900;
const VISIBLE_MS = 2600;
/** Longest toast clip per language (Arabic runs ~3.3s) plus a short breath. */
const VOICE_MS = { en: 2400, ar: 4000 } as const;

export function StickerToast() {
  const { t } = useTranslation();
  const { play, prewarm } = useSound();
  const [current, setCurrent] = useState<string | null>(null);
  const queue = useRef<string[]>([]);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const enter = useMemo(() => new Animated.Value(0), []);
  const spin = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    prewarm([`sticker.new.${currentLanguage()}`]);
  }, [prewarm]);

  useEffect(() => {
    const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

    // Wait out any modal game overlay: a toast behind it would expire unseen.
    const cancels: (() => void)[] = [];
    const showNext = () => cancels.push(whenOverlayClear(present));
    const present = () => {
      const id = queue.current.shift();
      if (!id) {
        busy.current = false;
        return;
      }
      busy.current = true;
      setCurrent(id);
      holdVoice(VOICE_MS[currentLanguage()] ?? VOICE_MS.ar);
      enter.setValue(0);
      spin.setValue(0);
      play(
        id === DAILY_GOAL_EVENT ? `praise.${currentLanguage()}.3` : `sticker.new.${currentLanguage()}`,
        { haptic: false },
      );
      Animated.parallel([
        Animated.spring(enter, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]).start();
      later(() => {
        Animated.timing(enter, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
          setCurrent(null);
          showNext();
        });
      }, VISIBLE_MS);
    };

    const unsub = onStickerUnlocked((id) => {
      queue.current.push(id);
      if (!busy.current) {
        busy.current = true;
        later(showNext, SHOW_DELAY_MS);
      }
    });
    const pending = timers.current;
    return () => {
      unsub();
      pending.forEach(clearTimeout);
      cancels.forEach((c) => c());
    };
  }, [enter, play, spin]);

  if (!current) return null;
  const daily = current === DAILY_GOAL_EVENT;

  return (
    <View style={styles.anchor} pointerEvents="none">
      <Animated.View
        style={[
          styles.card,
          SHADOWS.lg,
          {
            opacity: enter,
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
              { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
            ],
          },
        ]}
      >
        <Mascot pose="cheer" size={84} bob={false} />
        <View style={styles.text}>
          <Text style={styles.title}>{t(daily ? 'daily.done' : 'stickers.new')}</Text>
          {daily ? null : <Text style={styles.sub}>{t('stickers.addedToBook')}</Text>}
        </View>
        <Animated.View
          style={{
            transform: [
              { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['-200deg', '-8deg'] }) },
              { scale: spin.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.2, 1.2, 1] }) },
            ],
          }}
        >
          {daily ? (
            <Text style={styles.dailyStars}>{'⭐'.repeat(DAILY_GOAL)}</Text>
          ) : (
            <Sticker id={current} size={76} />
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: SPACING.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingStart: SPACING.sm,
    paddingEnd: SPACING.lg,
    borderRadius: BORDER_RADIUS.tile,
    borderWidth: OUTLINE.thick,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  text: { gap: 2 },
  title: { fontFamily: FONTS.displayBold, fontSize: FONT_SIZES.md, color: COLORS.ink },
  sub: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.inkSoft },
  dailyStars: { fontSize: 34 },
});
