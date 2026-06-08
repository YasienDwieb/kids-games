import { useEffect, useRef } from 'react';
import { Animated, I18nManager, StyleSheet, Text, View } from 'react-native';
import {
  PressableButton,
  Star,
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
  useTranslation,
} from '@/sdk';
import { EMOJI } from '../constants';

interface WinOverlayProps {
  collected: number;
  total: number;
  onNext: () => void;
}

/** Full-screen celebration shown when the mouse reaches its cheese. */
export function WinOverlay({ collected, total, onNext }: WinOverlayProps) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const { t } = useTranslation();

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);

  // Arrow points in the reading-forward direction: ← in RTL, → in LTR.
  const nextLabel = I18nManager.isRTL
    ? `${t('mouse-maze:win.nextMaze')} ←`
    : `${t('mouse-maze:win.nextMaze')} →`;

  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.burst}>🎉 {EMOJI.goal} 🎉</Text>
        <Text style={styles.title}>{t('mouse-maze:win.title')}</Text>

        <View style={styles.starsRow}>
          {Array.from({ length: total }).map((_, i) => (
            <Star key={i} size={i === 1 ? 44 : 38} filled={i < collected} />
          ))}
        </View>

        <PressableButton
          label={nextLabel}
          accent="orange"
          onPress={onNext}
          style={styles.button}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.tile,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
    maxWidth: 320,
    ...SHADOWS.lg,
  },
  burst: { fontSize: 44 },
  title: { fontFamily: FONTS.displayBold, fontSize: 28, color: COLORS.ink },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: SPACING.xs },
  button: { alignSelf: 'stretch', marginTop: SPACING.xs },
});
