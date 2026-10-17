/**
 * Warm-up story on the board: `from` waits just off the start of the road, `to`
 * just off its end. When the stroke is done, `from` travels the road to `to` and
 * both hop. All coordinates are box units (physical, like the glyph).
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { EmojiImage, useReduceMotion, useSound } from '@/sdk';
import { TRACK_WIDTH } from '../constants';
import type { Glyph, Pt } from '../types';

/** Emoji size and its clear gap from the road's edge, in box units. */
export const EMOJI = 20;
export const GAP = 3;
export const REACH = TRACK_WIDTH / 2 + GAP + EMOJI / 2;
// The board draws the box with TRACK_WIDTH / 2 of padding on every side.
const MIN = -TRACK_WIDTH / 2 + EMOJI / 2;
const MAX = 100 + TRACK_WIDTH / 2 - EMOJI / 2;
const TRAVEL_MS = 1100;
/** How long the warm-up's finish takes to play out (the host holds the board this long). */
export const TRAVEL_HOLD_MS = TRAVEL_MS + 500;

const clearance = (c: Pt, pts: readonly Pt[]) =>
  Math.min(...pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));

/**
 * A spot for an emoji next to the road end `i` (0 or the last index): straight out
 * past the end if that fits, else swinging round it, keeping clear of the whole
 * road, the board edge and `avoid`. Falls back to the end itself when boxed in.
 */
export function spotFor(pts: readonly Pt[], i: number, avoid?: Pt): Pt {
  const end = pts[i];
  const back = pts[i === 0 ? Math.min(4, pts.length - 1) : Math.max(0, i - 4)];
  const out = Math.atan2(end[1] - back[1], end[0] - back[0]);
  for (let step = 0; step <= 12; step++) {
    for (const sign of step === 0 || step === 12 ? [1] : [1, -1]) {
      const a = out + (sign * step * Math.PI) / 12;
      const c: Pt = [end[0] + REACH * Math.cos(a), end[1] + REACH * Math.sin(a)];
      if (c[0] < MIN || c[0] > MAX || c[1] < MIN || c[1] > MAX) continue;
      if (clearance(c, pts) < REACH - 0.5) continue;
      if (avoid && Math.hypot(c[0] - avoid[0], c[1] - avoid[1]) < EMOJI + GAP) continue;
      return c;
    }
  }
  return end;
}

/** Where the two emoji wait, for a one-path warm-up glyph. */
export function spotsFor(glyph: Glyph): { from: Pt; to: Pt; road: readonly Pt[] } {
  const stroke = glyph.strokes[0];
  const road = stroke.kind === 'path' ? stroke.points : [stroke.at];
  const from = spotFor(road, 0);
  return { from, to: spotFor(road, road.length - 1, from), road };
}

const STOPS = 24;

/** The traveller's route: its spot, the road (thinned to STOPS points), then up to its goal. */
export function routeFor(from: Pt, road: readonly Pt[], to: Pt): Pt[] {
  const thin = Array.from({ length: STOPS + 1 }, (_, k) => road[Math.round((k * (road.length - 1)) / STOPS)]);
  const last = thin[thin.length - 1];
  const d = Math.hypot(to[0] - last[0], to[1] - last[1]);
  // Stop touching the goal, not on top of it.
  const f = d > 0 ? Math.max(0, (d - EMOJI * 0.6) / d) : 0;
  return [from, ...thin, [last[0] + (to[0] - last[0]) * f, last[1] + (to[1] - last[1]) * f]];
}

type TravellersProps = {
  glyph: Glyph;
  from: string;
  to: string;
  /** Which way `from` looks as drawn; it turns to face its goal. */
  faces?: 'left';
  done: boolean;
  scale: number;
};

export function Travellers({ glyph, from, to, faces, done, scale }: TravellersProps) {
  const reduce = useReduceMotion();
  const { play } = useSound();
  const spots = useMemo(() => spotsFor(glyph), [glyph]);
  const route = useMemo(() => routeFor(spots.from, spots.road, spots.to), [spots]);
  const go = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!done) return;
    const happy = Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, friction: 3, useNativeDriver: true }),
    ]);
    if (reduce) {
      go.setValue(1);
      return;
    }
    play('transition');
    const anim = Animated.sequence([
      Animated.timing(go, { toValue: 1, duration: TRAVEL_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      happy,
    ]);
    anim.start();
    return () => anim.stop();
    // Once per finish; `play` changes identity with sound settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, go, hop, reduce]);

  const size = EMOJI * scale;
  const px = (v: number) => v * scale - size / 2;
  const input = route.map((_, k) => k / (route.length - 1));
  const lift = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.35] });
  const grow = hop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  // Noto draws some animals looking left; turn them toward the goal.
  const flip = faces === 'left' && spots.to[0] > spots.from[0];

  return (
    <>
      <Animated.View
        testID="goal"
        style={[styles.abs, { width: size, height: size, transform: [{ translateX: px(spots.to[0]) }, { translateY: px(spots.to[1]) }, { translateY: lift }, { scale: grow }] }]}
      >
        <EmojiImage emoji={to} size={size} />
      </Animated.View>
      <Animated.View
        testID="traveller"
        style={[
          styles.abs,
          {
            width: size,
            height: size,
            transform: [
              { translateX: go.interpolate({ inputRange: input, outputRange: route.map((p) => px(p[0])) }) },
              { translateY: go.interpolate({ inputRange: input, outputRange: route.map((p) => px(p[1])) }) },
              { translateY: lift },
              { scale: grow },
              { scaleX: flip ? -1 : 1 },
            ],
          },
        ]}
      >
        <EmojiImage emoji={from} size={size} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
});
