/**
 * The finish reward: an outlined "I can write …!" ("I can draw …!" for warm-ups)
 * card (glyph + word picture) that pops in, holds, then shrinks away toward the
 * start side (~1.5 s) before calling `onDone`.
 */
import { useEffect, useMemo } from 'react';
import { Animated, Easing, I18nManager, StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  ClayEmoji,
  FONTS,
  fontsFor,
  OUTLINE,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import { charLanguage, type TraceChar } from '../catalog';

const POP_MS = 300;
const HOLD_MS = 800;
const AWAY_MS = 400;

export function WinSticker({ char, onDone }: { char: TraceChar; onDone: () => void }) {
  const { t } = useTranslation();
  const v = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
      Animated.delay(HOLD_MS),
      Animated.timing(v, { toValue: 2, duration: AWAY_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && onDone());
    return () => anim.stop();
    // Plays once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const warmup = char.track === 'warmup';
  const glyph = warmup ? t(char.nameKey) : char.label;
  const picture = warmup ? char.to : char.emoji;
  // Shrinks toward the start side (left in LTR, right in RTL): physical px.
  const away = I18nManager.isRTL ? 240 : -240;
  const style = {
    opacity: v.interpolate({ inputRange: [0, 0.2, 1.6, 2], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateX: v.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, away] }) },
      { scale: v.interpolate({ inputRange: [0, 1, 2], outputRange: [0.4, 1, 0.2] }) },
    ],
  };

  return (
    <View style={styles.layer} pointerEvents="none">
      <Animated.View style={[styles.card, style]}>
        {warmup ? null : <Text style={[styles.glyph, { fontFamily: fontsFor(charLanguage(char)).display }]}>{char.label}</Text>}
        {picture ? <ClayEmoji emoji={picture} size={72} /> : null}
        <Text style={styles.caption}>{t(warmup ? 'trace-it:sticker.iCanDraw' : 'trace-it:sticker.iCanWrite', { glyph })}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  card: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: OUTLINE.thick,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    ...SHADOWS.lg,
  },
  glyph: { fontFamily: FONTS.display, fontSize: 80, lineHeight: 100, color: COLORS.ink },
  caption: { fontFamily: FONTS.display, fontSize: 26, color: COLORS.ink, textAlign: 'center' },
});
