/**
 * Numbers Land — level-solved overlay (rendered via GameShell 'win' slot).
 *
 *   - isLast → trophy 🏆 + "All Done!" finish button.
 *   - otherwise → star ⭐️ + "Next Number" button.
 *
 * Pop-in via RN Animated (useNativeDriver: true). All user-facing strings via
 * t(); digit glyphs are authored DATA elsewhere.
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
        <EmojiFrame emoji={isLast ? '🏆' : '⭐️'} size={72} tint={ACCENTS.orange.tint} />
        <View style={styles.starsRow}>
          <Star size={28} filled />
          <Star size={36} filled />
          <Star size={28} filled />
        </View>
        <Text style={styles.title}>{t('numbers-land:levelSolved.title')}</Text>
        <PressableButton
          label={t(`numbers-land:levelSolved.${isLast ? 'finish' : 'next'}`)}
          onPress={onNext}
          accent="orange"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.tile,
    backgroundColor: COLORS.surface,
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
