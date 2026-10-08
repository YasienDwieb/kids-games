/**
 * Lulu the owl — the app's mascot. One character across every game: she cheers
 * on wins, points at hints, encourages after a miss, and hands out stickers.
 *
 *   <Mascot pose="cheer" size={120} />
 *
 * Poses are flat PNG cut-outs (Higgsfield-generated, see CREDITS.md). Motion is
 * done here: a gentle idle bob, and a squash-and-pop whenever the pose changes,
 * so she always feels alive without a rig.
 */
import { useEffect, useMemo } from 'react';
import { Animated, Easing, I18nManager, type ImageSourcePropType, type ImageStyle } from 'react-native';

export type MascotPose = 'wave' | 'cheer' | 'point' | 'encourage';

const POSES: Record<MascotPose, ImageSourcePropType> = {
  wave: require('../assets/images/mascot/owl-wave.png'),
  cheer: require('../assets/images/mascot/owl-cheer.png'),
  point: require('../assets/images/mascot/owl-point.png'),
  encourage: require('../assets/images/mascot/owl-encourage.png'),
};

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
  style?: ImageStyle;
};

export function Mascot({ pose = 'wave', size = 96, bob = true, pointTo, style }: MascotProps) {
  const pop = useMemo(() => new Animated.Value(0), []);
  const float = useMemo(() => new Animated.Value(0), []);

  // Squash-and-pop on every pose change (and on mount).
  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  }, [pop, pose]);

  useEffect(() => {
    if (!bob) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, float]);

  // The art points right; mirror it when she should point left.
  const towardLeft = (pointTo ?? (I18nManager.isRTL ? 'left' : 'right')) === 'left';
  const flip = pose === 'point' && towardLeft ? -1 : 1;

  return (
    <Animated.Image
      source={POSES[pose]}
      accessibilityIgnoresInvertColors
      style={[
        {
          width: size,
          height: size,
          transform: [
            { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.05] }) },
            { scaleX: Animated.multiply(pop.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1] }), flip) },
            { scaleY: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
          ],
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
}
