/**
 * Lulu popping in from a corner to react to the child — the one-line way for a
 * game to use the mascot:
 *
 *   <MascotHelper pose={missed ? 'encourage' : null} />
 *
 * `pose={null}` slides her away; any pose slides her in (and a pose change
 * squash-pops via <Mascot>). Touch-transparent and absolutely positioned at the
 * bottom of the nearest positioned parent, so it never blocks the game.
 */
import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { SPACING } from '@/constants/dimensions';
import { Mascot, type MascotPose } from './Mascot';

type MascotHelperProps = {
  pose: MascotPose | null;
  size?: number;
  /** Corner to sit in, by reading direction (default 'start'). */
  side?: 'start' | 'end';
  /** Physical direction for the 'point' pose (see <Mascot>). */
  pointTo?: 'left' | 'right';
};

export function MascotHelper({ pose, size = 110, side = 'start', pointTo }: MascotHelperProps) {
  const show = useMemo(() => new Animated.Value(0), []);
  // Keep drawing the last pose while she slides out.
  const [shown, setShown] = useState<MascotPose | null>(pose);

  useEffect(() => {
    if (pose) setShown(pose);
    Animated.spring(show, {
      toValue: pose ? 1 : 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !pose) setShown(null);
    });
  }, [pose, show]);

  if (!shown) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.corner,
        side === 'start' ? styles.start : styles.end,
        {
          opacity: show,
          transform: [{ translateY: show.interpolate({ inputRange: [0, 1], outputRange: [size, 0] }) }],
        },
      ]}
    >
      <Mascot pose={shown} size={size} pointTo={pointTo} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', bottom: SPACING.xs, zIndex: 40 },
  start: { start: SPACING.md },
  end: { end: SPACING.md },
});
