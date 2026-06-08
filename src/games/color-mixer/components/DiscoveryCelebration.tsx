import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS, BORDER_RADIUS, SHADOWS, PressableButton, useTranslation } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { Sparkles } from './Sparkles';
import { COLORS, TIMING } from '../constants';
import type { ColorId } from '../types';

type DiscoveryCelebrationProps = {
  colorId: ColorId | null;
  visible: boolean;
  onComplete: () => void;
};

export function DiscoveryCelebration({
  colorId,
  visible,
  onComplete,
}: DiscoveryCelebrationProps) {
  const { t } = useTranslation();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const blobScale = useRef(new Animated.Value(0)).current;
  const sparklesOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !colorId) return;

    overlayOpacity.setValue(0);
    cardScale.setValue(0.8);
    blobScale.setValue(0);
    sparklesOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(blobScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(sparklesOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(onComplete, TIMING.DISCOVERY_CELEBRATION_DURATION);
    return () => clearTimeout(timer);
  }, [visible, colorId, overlayOpacity, cardScale, blobScale, sparklesOpacity, onComplete]);

  if (!visible || !colorId) return null;

  const colorData = COLORS[colorId];

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.touchArea} onPress={onComplete}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
            <Text style={styles.title}>{t('color-mixer:discovery.title')}</Text>

            <View style={styles.blobArea}>
              <Animated.View style={[styles.sparkleLayer, { opacity: sparklesOpacity }]}>
                <Sparkles color={colorData.hex} radius={110} />
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: blobScale }] }}>
                <ColorBlob color={colorData.hex} size={110} showShine />
              </Animated.View>
            </View>

            <Text style={styles.colorName}>{t(`color-mixer:colors.${colorId}`)}</Text>

            <PressableButton label={t('color-mixer:discovery.yay')} accent="blue" onPress={onComplete} style={styles.cta} />
          </Animated.View>
        </Animated.View>
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
  card: {
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: BORDER_RADIUS.tile,
    paddingHorizontal: 32,
    paddingVertical: 28,
    ...SHADOWS.lg,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    color: TOKENS.ink,
    marginBottom: 16,
    textAlign: 'center',
  },
  blobArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorName: {
    fontFamily: FONTS.displayBold,
    fontSize: 32,
    color: TOKENS.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    minWidth: 140,
  },
});
