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
import { BUDDIES, BUDDY_LOOKS, useBuddy, useBuddyArt, type BuddyArt, type BuddyId } from '@/sdk/buddy';
import { outfitById, outfitFor } from '@/sdk/player/outfits';
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

/**
 * Where the head sits in each pose, as fractions of the square image, and the
 * pupils (left x, right x, y) the glasses are fitted to. Measured per pose:
 * heads turn and tilt, so the eyes aren't a fixed spot on the head.
 */
type Head = { x: number; top: number; w: number; eyes: readonly [number, number, number] };

const HEADS: Record<BuddyArt, Record<MascotPose, Head>> = {
  mariamHijab: {
    wave: { x: 0.49, top: 0.04, w: 0.38, eyes: [0.404, 0.521, 0.233] },
    cheer: { x: 0.48, top: 0.04, w: 0.34, eyes: [0.462, 0.606, 0.245] },
    point: { x: 0.47, top: 0.04, w: 0.35, eyes: [0.439, 0.55, 0.237] },
    encourage: { x: 0.49, top: 0.04, w: 0.35, eyes: [0.423, 0.55, 0.234] },
  },
  mariam: {
    wave: { x: 0.49, top: 0.06, w: 0.32, eyes: [0.429, 0.544, 0.252] },
    cheer: { x: 0.49, top: 0.06, w: 0.32, eyes: [0.478, 0.61, 0.276] },
    point: { x: 0.47, top: 0.06, w: 0.32, eyes: [0.48, 0.576, 0.252] },
    encourage: { x: 0.5, top: 0.06, w: 0.32, eyes: [0.434, 0.556, 0.254] },
  },
  anas: {
    wave: { x: 0.47, top: 0.04, w: 0.37, eyes: [0.401, 0.521, 0.283] },
    cheer: { x: 0.46, top: 0.05, w: 0.35, eyes: [0.455, 0.569, 0.287] },
    point: { x: 0.45, top: 0.04, w: 0.37, eyes: [0.433, 0.55, 0.283] },
    encourage: { x: 0.49, top: 0.04, w: 0.37, eyes: [0.448, 0.55, 0.283] },
  },
};

/**
 * Side items (Mariam's flower and bow) sit on her pigtail, in head widths:
 * size, and the centre's offset from the head's middle (x) and top edge (y,
 * to the item's top).
 */
const SIDE = { s: 0.34, dx: 0.33, dy: 0.08 };

/**
 * Anas's body spots per pose, as fractions of the image: where the parrot's
 * feet rest (his free shoulder, image-left in every pose) and the collar the
 * medal hangs from.
 */
type Body = { shoulder: readonly [number, number]; neck: readonly [number, number] };

const BODIES: Partial<Record<BuddyArt, Record<MascotPose, Body>>> = {
  anas: {
    wave: { shoulder: [0.34, 0.485], neck: [0.465, 0.45] },
    cheer: { shoulder: [0.36, 0.455], neck: [0.49, 0.465] },
    point: { shoulder: [0.325, 0.48], neck: [0.47, 0.43] },
    encourage: { shoulder: [0.36, 0.475], neck: [0.5, 0.44] },
  },
};

const PERCH = 0.14; // parrot size, of the image
const MEDAL = 0.12;

const ownerOf = (art: BuddyArt): BuddyId => BUDDIES.find((b) => BUDDY_LOOKS[b].includes(art)) ?? BUDDIES[0];

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

function Worn({ wearing, art, pose, size }: { wearing: Wearing; art: BuddyArt; pose: MascotPose; size: number }) {
  const head = HEADS[art][pose];
  const body = BODIES[art]?.[pose];
  const headW = head.w * size;
  const cx = head.x * size;
  const items: ReactNode[] = [];

  const hat = outfitFor(wearing.hat, ownerOf(art));
  if (hat?.spot === 'shoulder' || hat?.spot === 'chest') {
    if (body) {
      const shoulder = hat.spot === 'shoulder';
      const [px, py] = shoulder ? body.shoulder : body.neck;
      const s = (shoulder ? PERCH : MEDAL) * size;
      // The parrot stands on its feet (bottom of the art) facing the buddy;
      // the medal's ribbon starts at the collar.
      const top = shoulder ? py * size - s * 0.92 : py * size - s * 0.05;
      items.push(
        <View
          key="hat"
          style={[styles.item, { left: px * size - s / 2, top, width: s, height: s }, shoulder && styles.mirror]}
        >
          <EmojiImage emoji={hat.emoji} size={s} />
        </View>,
      );
    }
  } else if (hat) {
    const side = hat.spot === 'side';
    const s = headW * (side ? SIDE.s : 0.62);
    const x = side ? cx + headW * SIDE.dx : cx;
    const y = side ? head.top * size + headW * SIDE.dy : head.top * size + headW * 0.2 - s;
    items.push(
      <View key="hat" style={[styles.item, { left: x - s / 2, top: y, width: s, height: s }]}>
        {hat.id === 'party-hat' ? <PartyHat size={s} /> : <EmojiImage emoji={hat.emoji} size={s} />}
      </View>,
    );
  }

  const glasses = outfitById(wearing.glasses);
  if (glasses) {
    // The Noto glasses' lenses sit ~0.47 of the image apart; a touch smaller
    // than an exact fit reads better on these round faces.
    const [l, r, eyeY] = head.eyes;
    const s = (r - l) * 2 * size;
    const gx = ((l + r) / 2) * size;
    items.push(
      <View key="glasses" style={[styles.item, { left: gx - s / 2, top: eyeY * size - s / 2, width: s, height: s }]}>
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
      {wearing ? <Worn wearing={wearing} art={who} pose={pose} size={size} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  mirror: { transform: [{ scaleX: -1 }] },
  pom: { backgroundColor: COLORS.gold, marginBottom: -4, zIndex: 1 },
});
