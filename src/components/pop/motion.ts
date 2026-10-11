import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/** True while the OS "Reduce motion" setting is on. Loops stop; one-shot bursts stay. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/**
 * A 0→1→0 value that loops forever (bob, pulse, wiggle), or a 0→1 ramp that
 * restarts (`mode: 'repeat'`, for spins). Parked at 0 when reduce-motion is on
 * or `enabled` is false.
 */
export function useLoop(
  duration: number,
  { enabled = true, mode = 'pingpong', delay = 0 }: { enabled?: boolean; mode?: 'pingpong' | 'repeat'; delay?: number } = {},
): Animated.Value {
  const value = useMemo(() => new Animated.Value(0), []);
  const reduce = useReduceMotion();
  const run = enabled && !reduce;
  useEffect(() => {
    if (!run) {
      value.setValue(0);
      return;
    }
    const ease = mode === 'repeat' ? Easing.linear : Easing.inOut(Easing.sin);
    const anim =
      mode === 'repeat'
        ? Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: ease, useNativeDriver: true }))
        : Animated.loop(
            Animated.sequence([
              Animated.timing(value, { toValue: 1, duration: duration / 2, easing: ease, useNativeDriver: true }),
              Animated.timing(value, { toValue: 0, duration: duration / 2, easing: ease, useNativeDriver: true }),
            ]),
          );
    const timer = setTimeout(() => anim.start(), delay);
    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [delay, duration, mode, run, value]);
  return value;
}

/** Transform helpers over a 0..1 loop value. */
export const bob = (v: Animated.Value, px = 8) => ({
  transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -px] }) }],
});
export const pulse = (v: Animated.Value, by = 0.06) => ({
  transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + by] }) }],
});
export const wiggle = (v: Animated.Value, deg = 5) => ({
  transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`-${deg}deg`, `${deg}deg`] }) }],
});
