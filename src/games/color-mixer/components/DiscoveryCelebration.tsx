import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const blobScale = useRef(new Animated.Value(0)).current;
  const nameScale = useRef(new Animated.Value(0)).current;
  const sparklesOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !colorId) return;

    // Reset
    overlayOpacity.setValue(0);
    titleSlide.setValue(-30);
    titleOpacity.setValue(0);
    blobScale.setValue(0);
    nameScale.setValue(0);
    sparklesOpacity.setValue(0);

    // Sequenced entrance
    Animated.sequence([
      // 1. Overlay fades in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // 2. "You discovered" slides down
      Animated.parallel([
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 3. Blob bounces in + sparkles
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
      // 4. Color name pops in
      Animated.spring(nameScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(onComplete, TIMING.DISCOVERY_CELEBRATION_DURATION);
    return () => clearTimeout(timer);
  }, [visible, colorId, overlayOpacity, titleSlide, titleOpacity, blobScale, nameScale, sparklesOpacity, onComplete]);

  if (!visible || !colorId) return null;

  const colorData = COLORS[colorId];

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.touchArea} onPress={onComplete}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <View style={styles.content}>
            {/* Title */}
            <Animated.Text
              style={[
                styles.title,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleSlide }],
                },
              ]}
            >
              You discovered
            </Animated.Text>

            {/* Blob + Sparkles */}
            <View style={styles.blobArea}>
              <Animated.View style={{ opacity: sparklesOpacity }}>
                <Sparkles color={colorData.hex} radius={120} />
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: blobScale }] }}>
                <ColorBlob color={colorData.hex} size={120} showShine />
              </Animated.View>
            </View>

            {/* Color name */}
            <Animated.Text
              style={[
                styles.colorName,
                { color: colorData.hex },
                { transform: [{ scale: nameScale }] },
              ]}
            >
              {colorData.name}!
            </Animated.Text>

            <Animated.Text style={[styles.tapHint, { opacity: nameScale }]}>
              Tap anywhere to continue
            </Animated.Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  blobArea: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorName: {
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tapHint: {
    marginTop: 32,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
