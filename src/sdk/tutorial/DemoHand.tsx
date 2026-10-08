/**
 * A ghost hand 👆 that shows a pre-reader what to do — tap a spot, or drag
 * along a path — and loops until the game hides it.
 *
 *   <DemoHand mode="tap"  points={[{ x: 120, y: 200 }]} />
 *   <DemoHand mode="drag" points={[a, b, c]} />
 *
 * Points are in the coordinate space of the hand's parent (it renders
 * absolutely positioned, pointerEvents="none"). The fingertip — not the
 * glyph's corner — lands on each point. Coordinates are physical, so games
 * pinned with direction:'ltr' pass the same values in both languages.
 */
import { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { EmojiImage } from '@/components/common';

export type DemoPoint = { x: number; y: number };

type DemoHandProps = {
  mode: 'tap' | 'drag';
  points: DemoPoint[];
  /** Glyph size in dp (default 56). */
  size?: number;
  /** Pause between loops in ms (default 700). */
  pauseMs?: number;
};

const MOVE_MS = 420;

export function DemoHand({ mode, points, size = 56, pauseMs = 700 }: DemoHandProps) {
  const pos = useMemo(() => new Animated.ValueXY(points[0] ?? { x: 0, y: 0 }), [points]);
  const press = useMemo(() => new Animated.Value(0), [points]);
  const opacity = useMemo(() => new Animated.Value(0), [points]);

  useEffect(() => {
    if (points.length === 0) return;
    const first = points[0];
    const steps: Animated.CompositeAnimation[] = [
      Animated.timing(pos, { toValue: first, duration: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ];

    const tapAt = () =>
      Animated.sequence([
        Animated.timing(press, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(press, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]);
    const moveTo = (p: DemoPoint) =>
      Animated.timing(pos, {
        toValue: p,
        duration: MOVE_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    if (mode === 'tap') {
      points.forEach((p, i) => {
        if (i > 0) steps.push(moveTo(p));
        steps.push(tapAt(), Animated.delay(250));
      });
    } else {
      // Press down, travel the whole path held, lift at the end.
      steps.push(Animated.timing(press, { toValue: 1, duration: 140, useNativeDriver: true }));
      points.slice(1).forEach((p) => steps.push(moveTo(p)));
      steps.push(Animated.timing(press, { toValue: 0, duration: 160, useNativeDriver: true }));
    }

    steps.push(
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.delay(pauseMs),
    );

    const loop = Animated.loop(Animated.sequence(steps));
    loop.start();
    return () => loop.stop();
  }, [mode, opacity, pauseMs, points, pos, press]);

  if (points.length === 0) return null;

  // 👆's fingertip sits near the top-centre of the glyph box.
  const offsetX = -size / 2;
  const offsetY = -size * 0.08;

  return (
    // An LTR-pinned full-size layer: transforms are physical, and pinning keeps
    // the hand's origin at the physical top-left in Arabic too.
    <Animated.View pointerEvents="none" style={styles.layer}>
      <Animated.View
        style={[
          styles.hand,
          {
            opacity,
            transform: [
              { translateX: offsetX },
              { translateY: offsetY },
              ...pos.getTranslateTransform(),
              { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) },
            ],
          },
        ]}
      >
        <EmojiImage emoji="👆" size={size} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, direction: 'ltr', zIndex: 50 },
  hand: { position: 'absolute', left: 0, top: 0 },
});
