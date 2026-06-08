import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PressableButton, Star, COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING, useTranslation } from '@/sdk';

type Props = {
  variant: 'cleared' | 'failed';
  stars: number;
  isLast: boolean;
  popped: number;
  quota: number;
  onNext: () => void;
  onRetry: () => void;
};

export function LevelOverlay({ variant, stars, isLast, popped, quota, onNext, onRetry }: Props) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const { t } = useTranslation();
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);

  const cleared = variant === 'cleared';

  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {cleared ? (
          <>
            <Text style={styles.burst}>{isLast ? '🏆' : '🎯'}</Text>
            <Text style={styles.title}>
              {isLast ? t('balloon-archer:overlay.wonAll') : t('balloon-archer:overlay.niceShooting')}
            </Text>
            <View style={styles.starsRow}>
              {[0, 1, 2].map((i) => (
                <Star key={i} size={i === 1 ? 46 : 38} filled={i < stars} />
              ))}
            </View>
            <PressableButton
              label={isLast ? t('balloon-archer:overlay.playAgain') : t('balloon-archer:overlay.nextLevel')}
              accent="green"
              onPress={onNext}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Text style={styles.burst}>🎈</Text>
            <Text style={styles.title}>{t('balloon-archer:overlay.outOfArrows')}</Text>
            <Text style={styles.subtitle}>
              {t('balloon-archer:overlay.poppedCount', { popped, quota })}
            </Text>
            <PressableButton
              label={t('balloon-archer:overlay.tryAgain')}
              accent="orange"
              onPress={onRetry}
              style={styles.button}
            />
          </>
        )}
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
    gap: SPACING.sm,
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.lg,
  },
  burst: { fontSize: 44 },
  title: { fontFamily: FONTS.displayBold, fontSize: 26, color: COLORS.ink },
  subtitle: { fontFamily: FONTS.body, fontSize: 18, color: COLORS.inkSoft },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: SPACING.xs },
  button: { alignSelf: 'stretch', marginTop: SPACING.sm },
});
