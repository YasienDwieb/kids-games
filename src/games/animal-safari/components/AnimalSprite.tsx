/**
 * A clay animal for an Animal Safari choice tile, drawn from its pre-rendered
 * sprite sheet (no GL): it sways and breathes while idle, hops and turns a
 * full circle when it's the right answer, and shakes its head when a tap was
 * wrong. Drawn by the shared ListenFindBoard through its `renderImage` slot.
 *
 * The animals used to be live 3D, one GL context per tile, rebuilt every
 * round; on weak Android GPUs that crashed in expo-gl's EGL setup. The sheets
 * are renders of the same models, so they look the same and cost an image.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useLoop, useReduceMotion } from '@/sdk';
import { ANIMAL_SPRITES, SPRITE_COLS, SPRITE_FRAMES, SPRITE_ROWS } from '../animalSprites';

export type AnimalTileState = 'default' | 'correct' | 'wrong';

/** Share of the tile the animal fills (the old 3D camera's framing). */
const FILL_W = 0.92;
const FILL_H = 0.78;
const SPIN_MS = 900;

/** The sheet frame: frame 0 faces the viewer; a correct answer turns it once. */
function useSpinFrame(spinning: boolean): number {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!spinning) {
      setFrame(0);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setFrame(i % SPRITE_FRAMES);
      if (i >= SPRITE_FRAMES) clearInterval(timer);
    }, SPIN_MS / SPRITE_FRAMES);
    return () => clearInterval(timer);
  }, [spinning]);
  return frame;
}

export function AnimalSprite({ id, state, image }: { id: string; state: AnimalTileState; image: number }) {
  const sheet = ANIMAL_SPRITES[id];
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };

  const reduce = useReduceMotion();
  const frame = useSpinFrame(state === 'correct' && !reduce);
  // Idle: a slow sway and a breath (stops under Reduce Motion).
  const sway = useLoop(2600, { enabled: state === 'default' });
  const breath = useLoop(1400, { enabled: state === 'default', delay: 300 });

  // One-shot reactions: two hops for a right answer, a head shake for a wrong one.
  const hop = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state === 'correct' && !reduce) {
      hop.setValue(0);
      const up = (to: number) =>
        Animated.timing(hop, { toValue: to, duration: SPIN_MS / 4, easing: Easing.out(Easing.quad), useNativeDriver: true });
      const down = Animated.timing(hop, { toValue: 0, duration: SPIN_MS / 4, easing: Easing.in(Easing.quad), useNativeDriver: true });
      Animated.sequence([up(1), down, up(0.7), Animated.timing(hop, { toValue: 0, duration: SPIN_MS / 4, easing: Easing.bounce, useNativeDriver: true })]).start();
    } else if (state === 'wrong') {
      shake.setValue(0);
      Animated.timing(shake, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true }).start();
    }
  }, [state, reduce, hop, shake]);

  const size = Math.min(box.w * FILL_W, box.h * FILL_H);
  const motion = useMemo(
    () => ({
      transform: [
        { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.22] }) },
        { rotate: sway.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
        {
          rotate: shake.interpolate({
            inputRange: [0, 0.15, 0.35, 0.55, 0.75, 1],
            outputRange: ['0deg', '-10deg', '9deg', '-6deg', '3deg', '0deg'],
          }),
        },
        { scaleY: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) },
      ],
    }),
    [hop, sway, shake, breath, size],
  );

  if (sheet === undefined) {
    return <Image source={image} style={styles.image} resizeMode="contain" accessible={false} />;
  }

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]} onLayout={onLayout}>
      {size > 0 ? (
        // Feet on the ground: transforms pivot on the bottom of the animal.
        <Animated.View style={[{ width: size, height: size, transformOrigin: 'bottom' }, motion]}>
          {/* The sheet is physical pixels: pinned LTR so RTL doesn't flip the crop. */}
          <View style={[styles.clip, { width: size, height: size }]}>
            <Image
              source={sheet}
              accessible={false}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: size * SPRITE_COLS,
                height: size * SPRITE_ROWS,
                transform: [
                  { translateX: -(frame % SPRITE_COLS) * size },
                  { translateY: -Math.floor(frame / SPRITE_COLS) * size },
                ],
              }}
            />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  clip: { overflow: 'hidden', direction: 'ltr' },
  image: { width: 64, height: 64 },
});
