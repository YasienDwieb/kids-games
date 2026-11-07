/**
 * PaintThing — a challenge as something to paint, not a name to read.
 *
 * The object waits in grey and takes on the bowl's colour live as the child
 * mixes, so "getting warmer" shows on the thing itself. The target sits beside
 * it as a paint chip (tap to hear it). Once the colour is right, the object
 * comes to life as its full clay picture.
 */
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS as TOKENS, getClayImage, OUTLINE, SHADOWS } from '@/sdk';
import { ColorBlob } from './ColorBlob';

/** Before any paint: an unpainted, clay-grey shape. */
const UNPAINTED = '#D9D3C7';

type PaintThingProps = {
  emoji: string;
  targetHex: string;
  mixHex: string | null;
  /** True once the colour is right: the thing turns into its real picture. */
  painted: boolean;
  size: number;
  onSay?: () => void;
  accessibilityLabel?: string;
};

export function PaintThing({ emoji, targetHex, mixHex, painted, size, onSay, accessibilityLabel }: PaintThingProps) {
  const source = getClayImage(emoji);
  const reveal = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    reveal.setValue(0);
    pop.setValue(1);
    if (!painted) return;
    Animated.parallel([
      Animated.timing(reveal, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(pop, { toValue: 1.18, friction: 3, tension: 180, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
    ]).start();
  }, [painted, reveal, pop]);

  if (!source) return null;
  const img = { width: size, height: size };

  return (
    <View style={[styles.card, SHADOWS.md]} accessible accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[img, { transform: [{ scale: pop }] }]}>
        {/* The shape, filled with whatever is in the bowl. */}
        <Image source={source} style={[styles.layer, img, { tintColor: mixHex ?? UNPAINTED }]} resizeMode="contain" />
        {/* A little of the clay picture on top keeps its shading and detail. */}
        <Image source={source} style={[styles.layer, img, styles.shading]} resizeMode="contain" />
        {/* The real thing, once it's painted the right colour. */}
        <Animated.Image source={source} style={[styles.layer, img, { opacity: reveal }]} resizeMode="contain" />
      </Animated.View>
      <View style={styles.chip}>
        <ColorBlob color={targetHex} size={Math.round(size * 0.36)} showShine pulsing={!painted} onPress={onSay} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: TOKENS.surface,
  },
  layer: { position: 'absolute', top: 0, left: 0 },
  shading: { opacity: 0.32 },
  chip: { position: 'absolute', top: -14, end: -14 },
});
