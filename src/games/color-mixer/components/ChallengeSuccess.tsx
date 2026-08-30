import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, EmojiImage, FONTS, PressableButton, Star, useTranslation } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { Sparkles } from './Sparkles';

type ChallengeSuccessProps = {
  visible: boolean;
  targetHex: string;
  targetName: string;
  stars: number;
  onDismiss: () => void;
};

/**
 * Challenge celebration.
 *
 * Rendered at the game root — not inside `ChallengeMode` — because an `absoluteFillObject`
 * there covers only the challenge strip, which in landscape is ~76dp tall.
 *
 * It is always dismissible: by tapping anywhere, by the button, or by a timer. An earlier
 * version could get stuck on screen with no way out, so the exits are deliberately
 * redundant and the timer holds `onDismiss` in a ref — a callback whose identity changes
 * on re-render must not be able to restart or cancel it.
 */
export function ChallengeSuccess({
  visible,
  targetHex,
  targetName,
  stars,
  onDismiss,
}: ChallengeSuccessProps) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0)).current;

  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!visible) {
      scale.setValue(0);
      return;
    }
    scale.setValue(0);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();

    const timer = setTimeout(() => dismissRef.current(), 2600);
    return () => clearTimeout(timer);
  }, [visible, scale]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={styles.touchArea} onPress={onDismiss} accessibilityRole="button">
        <View style={styles.overlay}>
          <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
            <Sparkles color={targetHex} radius={100} />
            <EmojiImage emoji="🎉" size={44} style={styles.emoji} />
            <Text style={styles.text}>{t('color-mixer:challenge.success')}</Text>

            <View style={styles.stars}>
              {[1, 2, 3].map((n) => (
                <Star key={n} size={30} filled={n <= stars} />
              ))}
            </View>

            <ColorBlob color={targetHex} size={64} showShine />
            <Text style={styles.color}>{targetName}</Text>

            <PressableButton
              label={t('color-mixer:challenge.next')}
              accent="green"
              onPress={onDismiss}
              style={styles.cta}
            />
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: TOKENS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    marginBottom: 4,
  },
  text: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    color: TOKENS.surface,
    marginBottom: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  color: {
    marginTop: 6,
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: TOKENS.surface,
  },
  cta: {
    marginTop: 14,
    minWidth: 140,
  },
});
