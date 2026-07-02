/**
 * Animal Safari — level-solved overlay (rendered via GameShell 'win' slot).
 *
 * Mirrors letter-land/components/LevelSolvedOverlay.tsx, with the orange accent
 * family:
 *   - isLast → trophy 🏆 + "All Done!" finish button.
 *   - otherwise → star ⭐️ + "Next Animal" button.
 *
 * Pop-in via RN Animated (useNativeDriver: true) — no Reanimated.
 * All user-facing strings via t(); animal emoji are authored DATA elsewhere.
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  EmojiFrame,
  FONT_SIZES,
  FONTS,
  PressableButton,
  SHADOWS,
  SPACING,
  Star,
  useTranslation,
} from '@/sdk';

type LevelSolvedOverlayProps = {
  isLast: boolean;
  onNext: () => void;
};

export function LevelSolvedOverlay({
  isLast,
  onNext,
}: LevelSolvedOverlayProps): React.JSX.Element {
  const { t } = useTranslation();

  // Pop-in: scale 0.8 → 1 on mount (native driver, no Reanimated).
  const scale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.card, SHADOWS.lg, { transform: [{ scale }] }]}>
        <EmojiFrame
          emoji={isLast ? '🏆' : '⭐️'}
          size={72}
          tint={ACCENTS.orange.tint}
        />
        {/* 3-star reward row */}
        <View style={styles.starsRow}>
          <Star size={28} filled />
          <Star size={36} filled />
          <Star size={28} filled />
        </View>
        <Text style={styles.title}>{t('animal-safari:levelSolved.title')}</Text>
        <PressableButton
          label={t(`animal-safari:levelSolved.${isLast ? 'finish' : 'next'}`)}
          onPress={onNext}
          accent="orange"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.tile,
    backgroundColor: COLORS.surface,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
