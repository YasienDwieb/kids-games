import { useEffect, useRef } from 'react';
import { Animated, I18nManager, StyleSheet, Text, View } from 'react-native';
import {
  PressableButton,
  COLORS,
  FONTS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
  useTranslation,
} from '@/sdk';

function usePopIn() {
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);
  return scale;
}

function Card({ children }: { children: React.ReactNode }) {
  const scale = usePopIn();
  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>{children}</Animated.View>
    </View>
  );
}

export function StartOverlay({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <Card>
      <Text style={styles.burst}>🍬🍭🍪</Text>
      <Text style={styles.title}>{t('candy-catch:start.title')}</Text>
      <Text style={styles.sub}>{t('candy-catch:start.subtitle')}</Text>
      <PressableButton
        label={t('candy-catch:start.tap')}
        accent="pink"
        onPress={onStart}
        style={styles.button}
      />
    </Card>
  );
}

export function WinOverlay({ score, onNext }: { score: number; onNext: () => void }) {
  const { t } = useTranslation();
  const nextLabel = I18nManager.isRTL
    ? `${t('candy-catch:win.next')} ←`
    : `${t('candy-catch:win.next')} →`;
  return (
    <Card>
      <Text style={styles.burst}>🎉🍬🎉</Text>
      <Text style={styles.title}>{t('candy-catch:win.title')}</Text>
      <Text style={styles.sub}>{t('candy-catch:hud.score', { score })}</Text>
      <PressableButton label={nextLabel} accent="pink" onPress={onNext} style={styles.button} />
    </Card>
  );
}

export function LoseOverlay({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Card>
      <Text style={styles.burst}>😵🌶️</Text>
      <Text style={styles.title}>{t('candy-catch:lose.title')}</Text>
      <Text style={styles.sub}>{t('candy-catch:lose.subtitle')}</Text>
      <PressableButton
        label={t('candy-catch:lose.retry')}
        accent="pink"
        onPress={onRetry}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    zIndex: 20,
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
  burst: { fontSize: 52 },
  title: { fontFamily: FONTS.displayBold, fontSize: 30, color: COLORS.ink, textAlign: 'center' },
  sub: {
    fontFamily: FONTS.bodySemi,
    fontSize: 16,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  button: { alignSelf: 'stretch', marginTop: SPACING.xs },
});
