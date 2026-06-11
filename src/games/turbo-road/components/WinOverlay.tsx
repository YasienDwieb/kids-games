import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  I18nManager,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ACCENTS,
  COLORS,
  FONTS,
  PressableButton,
  SHADOWS,
  SPACING,
  Star,
  useTranslation,
} from '@/sdk';
import type { WinOverlayProps } from '../types';

const TROPHY: Record<1 | 2 | 3, string> = { 1: '🏆', 2: '🥈', 3: '🥉' };

/* Deterministic confetti layout — 12 small pieces in ACCENTS colors. */
const CONFETTI_COLORS = [
  ACCENTS.coral.base,
  COLORS.gold,
  ACCENTS.green.base,
  ACCENTS.blue.base,
  ACCENTS.orange.base,
  ACCENTS.purple.base,
] as const;

type ConfettiPiece = {
  x: number;
  size: number;
  round: boolean;
  color: string;
  duration: number;
  delay: number;
};

const CONFETTI: ConfettiPiece[] = Array.from({ length: 12 }, (_, i) => ({
  x: ((i * 83 + 19) % 100) / 100,
  size: 6 + (i % 3) * 2,
  round: i % 2 === 0,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 3200 + (i % 5) * 450,
  delay: (i % 4) * 550,
}));

export function WinOverlay({ place, stars, coinsEarned, onNext, onGarage }: WinOverlayProps) {
  const { t } = useTranslation();
  const window = useWindowDimensions();

  const trophyScale = useRef(new Animated.Value(0.3)).current;
  const starPops = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const confettiVals = useRef(CONFETTI.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = [
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      // Stars pop in staggered, 120ms apart.
      ...starPops.map((v, i) =>
        Animated.spring(v, {
          toValue: 1,
          friction: 4,
          delay: 250 + i * 120,
          useNativeDriver: true,
        }),
      ),
      // Falling confetti, looped.
      ...confettiVals.map((v, i) =>
        Animated.loop(
          Animated.timing(v, {
            toValue: 1,
            duration: CONFETTI[i].duration,
            delay: CONFETTI[i].delay,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ),
    ];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [trophyScale, starPops, confettiVals]);

  const nextGlyph = I18nManager.isRTL ? '‹' : '›';

  return (
    <View
      style={styles.scrim}
      // Presentational safeguard: claim touches so the race underneath
      // never receives taps while the overlay is up.
      onStartShouldSetResponder={() => true}
    >
      <View style={styles.confettiLayer} pointerEvents="none">
        {CONFETTI.map((c, i) => {
          const translateY = confettiVals[i].interpolate({
            inputRange: [0, 1],
            outputRange: [-24, window.height + 24],
          });
          const rotate = confettiVals[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '420deg'],
          });
          const opacity = confettiVals[i].interpolate({
            inputRange: [0, 0.85, 1],
            outputRange: [1, 1, 0],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: Math.round(c.x * window.width),
                  width: c.size,
                  height: c.round ? c.size : c.size * 1.5,
                  borderRadius: c.round ? c.size / 2 : 2,
                  backgroundColor: c.color,
                  opacity,
                  transform: [{ translateY }, { rotate }],
                },
              ]}
            />
          );
        })}
      </View>

      <View style={[styles.card, SHADOWS.lg]}>
        <Animated.Text
          style={[styles.trophy, { transform: [{ scale: trophyScale }] }]}
        >
          {TROPHY[place]}
        </Animated.Text>

        <Text style={styles.title}>{t(`turbo-road:win.title.p${place}`)}</Text>

        <View style={styles.starsRow}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={{ transform: [{ scale: starPops[i] }] }}>
              <Star size={i === 1 ? 48 : 38} filled={i < stars} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.coinsPill}>
          <Text style={styles.coinsText}>
            🪙 {t('turbo-road:win.coins', { n: coinsEarned })}
          </Text>
        </View>

        <View style={styles.buttons}>
          <PressableButton
            label={`${t('turbo-road:win.next')} ${nextGlyph}`}
            accent="coral"
            onPress={onNext}
          />
          <PressableButton
            label={t('turbo-road:win.garage')}
            variant="ghost"
            onPress={onGarage}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  trophy: {
    fontSize: 72,
    lineHeight: 84,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 30,
    color: COLORS.ink,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: ACCENTS.orange.tint,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginTop: SPACING.md,
  },
  coinsText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
  },
  buttons: {
    alignSelf: 'stretch',
    gap: SPACING.sm + SPACING.xs,
    marginTop: SPACING.lg,
  },
});
