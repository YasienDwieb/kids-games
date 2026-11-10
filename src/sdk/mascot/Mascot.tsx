/**
 * The child's buddy — Mariam (with pigtails or in her hijab) or Anas (see
 * `@/sdk/buddy`). One character across every game: cheers on wins, points at
 * hints, encourages after a miss, and hands out stickers.
 *
 *   <Mascot pose="cheer" size={120} />
 *   <Mascot pose="wave" buddy="anas" />            // a specific buddy (the picker)
 *   <Mascot pose="wave" look="mariamHijab" />      // a specific look (the wardrobe)
 *   <Mascot pose="wave" wearing={{ hat: 'crown', glasses: null }} />
 *
 * Poses are flat PNG cut-outs (Weave / Nano Banana, see CREDITS.md). Motion is
 * done here: a gentle idle bob, and a squash-and-pop whenever the pose changes.
 * Wardrobe items are drawn on top as stickers, placed from each pose's head.
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import {
  Animated,
  I18nManager,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { EmojiImage } from '@/components/common/EmojiImage';
import { useLoop } from '@/components/pop/motion';
import { COLORS, POP } from '@/constants/colors';
import { useBuddy, useBuddyArt, type BuddyArt, type BuddyId } from '@/sdk/buddy';
import { outfitById } from '@/sdk/player/outfits';
import type { Wearing } from '@/sdk/player/outfitStore';

export type MascotPose = 'wave' | 'cheer' | 'point' | 'encourage';

export const MASCOT_POSES: Record<BuddyArt, Record<MascotPose, ImageSourcePropType>> = {
  mariamHijab: {
    wave: require('../assets/images/mascot/mariam-hijab-wave.png'),
    cheer: require('../assets/images/mascot/mariam-hijab-cheer.png'),
    point: require('../assets/images/mascot/mariam-hijab-point.png'),
    encourage: require('../assets/images/mascot/mariam-hijab-encourage.png'),
  },
  mariam: {
    wave: require('../assets/images/mascot/mariam-wave.png'),
    cheer: require('../assets/images/mascot/mariam-cheer.png'),
    point: require('../assets/images/mascot/mariam-point.png'),
    encourage: require('../assets/images/mascot/mariam-encourage.png'),
  },
  anas: {
    wave: require('../assets/images/mascot/anas-wave.png'),
    cheer: require('../assets/images/mascot/anas-cheer.png'),
    point: require('../assets/images/mascot/anas-point.png'),
    encourage: require('../assets/images/mascot/anas-encourage.png'),
  },
};

/** Where the head sits in each pose, as fractions of the square image. */
type Head = { x: number; top: number; w: number; eyes: number };

const HEADS: Record<BuddyArt, Record<MascotPose, Head>> = {
  mariamHijab: {
    wave: { x: 0.49, top: 0.04, w: 0.38, eyes: 0.23 },
    cheer: { x: 0.48, top: 0.04, w: 0.34, eyes: 0.25 },
    point: { x: 0.47, top: 0.04, w: 0.35, eyes: 0.23 },
    encourage: { x: 0.49, top: 0.04, w: 0.35, eyes: 0.23 },
  },
  mariam: {
    wave: { x: 0.49, top: 0.06, w: 0.32, eyes: 0.23 },
    cheer: { x: 0.49, top: 0.06, w: 0.32, eyes: 0.25 },
    point: { x: 0.47, top: 0.06, w: 0.32, eyes: 0.24 },
    encourage: { x: 0.5, top: 0.06, w: 0.32, eyes: 0.24 },
  },
  anas: {
    wave: { x: 0.47, top: 0.04, w: 0.37, eyes: 0.28 },
    cheer: { x: 0.46, top: 0.05, w: 0.35, eyes: 0.28 },
    point: { x: 0.45, top: 0.04, w: 0.37, eyes: 0.28 },
    encourage: { x: 0.49, top: 0.04, w: 0.37, eyes: 0.28 },
  },
};

/** A party cone: the 🥳 tile art is a face, so the hat itself is drawn. */
function PartyHat({ size }: { size: number }) {
  const half = size * 0.36;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={[styles.pom, { width: size * 0.22, height: size * 0.22, borderRadius: size * 0.11 }]} />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderBottomWidth: size * 0.72,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: POP.bubblegum,
        }}
      />
    </View>
  );
}

function Worn({ wearing, head, size }: { wearing: Wearing; head: Head; size: number }) {
  const headW = head.w * size;
  const cx = head.x * size;
  const items: ReactNode[] = [];

  const hat = outfitById(wearing.hat);
  if (hat) {
    const side = hat.id === 'flower' || hat.id === 'bow';
    const s = side ? headW * 0.34 : headW * 0.62;
    const x = side ? cx + headW * 0.33 : cx;
    const y = side ? head.top * size + headW * 0.08 : head.top * size + headW * 0.2 - s;
    items.push(
      <View key="hat" style={[styles.item, { left: x - s / 2, top: y, width: s, height: s }]}>
        {hat.id === 'party-hat' ? <PartyHat size={s} /> : <EmojiImage emoji={hat.emoji} size={s} />}
      </View>,
    );
  }

  const glasses = outfitById(wearing.glasses);
  if (glasses) {
    const s = headW * 0.55;
    items.push(
      <View key="glasses" style={[styles.item, { left: cx - s / 2, top: head.eyes * size - s / 2, width: s, height: s }]}>
        <EmojiImage emoji={glasses.emoji} size={s} />
      </View>,
    );
  }

  return <>{items}</>;
}

type MascotProps = {
  pose?: MascotPose;
  size?: number;
  /** Idle bob (default true). Turn off inside dense lists. */
  bob?: boolean;
  /**
   * Which way the 'point' pose points, physically. Defaults to the reading
   * direction's "forward" (right in English, left in Arabic).
   */
  pointTo?: 'left' | 'right';
  /** Which buddy to draw; defaults to the child's chosen one. */
  buddy?: BuddyId;
  /** Which look to draw; defaults to the buddy's saved look. */
  look?: BuddyArt;
  /** Wardrobe items to draw on the buddy (none by default). */
  wearing?: Wearing;
  style?: StyleProp<ViewStyle>;
};

export function Mascot({ pose = 'wave', size = 96, bob = true, pointTo, buddy, look, wearing, style }: MascotProps) {
  const chosen = useBuddy();
  const saved = useBuddyArt(buddy ?? chosen);
  const who = look ?? saved;
  const pop = useMemo(() => new Animated.Value(0), []);
  const float = useLoop(1800, { enabled: bob });

  // Squash-and-pop on every pose change (and on mount).
  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  }, [pop, pose]);

  // Every buddy's art points right; mirror it to point left.
  const towardLeft = (pointTo ?? (I18nManager.isRTL ? 'left' : 'right')) === 'left';
  const flip = pose === 'point' && towardLeft ? -1 : 1;

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          direction: 'ltr',
          transform: [
            { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.05] }) },
            { scaleX: Animated.multiply(pop.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1] }), flip) },
            { scaleY: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
          ],
        },
        style,
      ]}
    >
      <Animated.Image
        source={MASCOT_POSES[who][pose]}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {wearing ? <Worn wearing={wearing} head={HEADS[who][pose]} size={size} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pom: { backgroundColor: COLORS.gold, marginBottom: -4, zIndex: 1 },
});
