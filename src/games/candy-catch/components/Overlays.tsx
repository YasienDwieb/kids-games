import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  Icon,
  Mascot,
  PressableButton,
  COLORS,
  FONTS,
  SHADOWS,
  OUTLINE,
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
      <View style={styles.choiceRow}>
        <Text style={styles.burst}>🍬🍭🍪</Text>
        <Icon name="checkmark-circle" size={40} color={ACCENTS.green.deep} />
      </View>
      <View style={styles.choiceRow}>
        <Text style={styles.burst}>🌶️💣</Text>
        <Icon name="close-circle" size={40} color={ACCENTS.coral.deep} />
      </View>
      <PressableButton
        accessibilityLabel={t('candy-catch:start.tap')}
        accent="pink"
        onPress={onStart}
        style={styles.button}
      >
        <Icon name="play" size={34} />
      </PressableButton>
    </Card>
  );
}

/** The short breather after losing the hearts; the round restarts by itself. */
export function LoseOverlay() {
  return (
    <Card>
      <Mascot pose="encourage" size={120} />
    </Card>
  );
}

const styles = StyleSheet.create({
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  backdrop: {
    ...StyleSheet.absoluteFill,
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
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
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
