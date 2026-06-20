// src/sdk/flow/ActorLayer.tsx
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { Actor } from './actors';
import { planTransition } from './transition';

type Tween = {
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  content: ReactNode;
};

function makeTween(a: Actor): Tween {
  return {
    x: new Animated.Value(a.x),
    y: new Animated.Value(a.y),
    scale: new Animated.Value(a.scale),
    rotation: new Animated.Value(a.rotation),
    opacity: new Animated.Value(a.opacity),
    content: a.content,
  };
}

export function ActorLayer({ actors, duration = 520 }: { actors: Actor[]; duration?: number }) {
  // Live tween handles per actor id, persisted across renders.
  const tweens = useRef<Map<string, Tween>>(new Map());
  // Ids currently mounted (includes those fading out), drives render.
  const [mountedIds, setMountedIds] = useState<string[]>([]);
  const prevActors = useRef<Actor[]>([]);

  useEffect(() => {
    const plan = planTransition(prevActors.current, actors);
    const tw = tweens.current;

    // Entering: create tweens starting transparent, then fade/scale in.
    for (const a of plan.entering) {
      const t = makeTween({ ...a, opacity: 0, scale: a.scale * 0.6 });
      tw.set(a.id, t);
    }
    // Ensure mounted set includes entering ids immediately.
    setMountedIds((ids) => Array.from(new Set([...ids, ...actors.map((a) => a.id)])));

    const animations: Animated.CompositeAnimation[] = [];

    // Entering settle.
    for (const a of plan.entering) {
      const t = tw.get(a.id)!;
      t.content = a.content;
      animations.push(
        Animated.parallel([
          Animated.timing(t.opacity, { toValue: a.opacity, duration, useNativeDriver: true }),
          Animated.spring(t.scale, { toValue: a.scale, useNativeDriver: true, speed: 12, bounciness: 8 }),
        ]),
      );
    }
    // Matched: morph geometry to target. (x/y not native-driver-able → separate driver.)
    for (const m of plan.matched) {
      const t = tw.get(m.id)!;
      t.content = m.content;
      animations.push(
        Animated.parallel([
          Animated.timing(t.x, { toValue: m.to.x, duration, useNativeDriver: false }),
          Animated.timing(t.y, { toValue: m.to.y, duration, useNativeDriver: false }),
          Animated.timing(t.scale, { toValue: m.to.scale, duration, useNativeDriver: true }),
          Animated.timing(t.rotation, { toValue: m.to.rotation, duration, useNativeDriver: true }),
          Animated.timing(t.opacity, { toValue: m.to.opacity, duration, useNativeDriver: true }),
        ]),
      );
    }
    // Leaving: fade + shrink, then unmount.
    for (const a of plan.leaving) {
      const t = tw.get(a.id);
      if (!t) continue;
      animations.push(
        Animated.parallel([
          Animated.timing(t.opacity, { toValue: 0, duration, useNativeDriver: true }),
          Animated.timing(t.scale, { toValue: a.scale * 0.6, duration, useNativeDriver: true }),
        ]),
      );
    }

    Animated.parallel(animations).start(() => {
      // Drop leaving tweens + prune mounted ids.
      for (const a of plan.leaving) tweens.current.delete(a.id);
      setMountedIds(actors.map((a) => a.id));
    });

    prevActors.current = actors;
  }, [actors, duration]);

  return (
    <View style={styles.layer} pointerEvents="none">
      {mountedIds.map((id) => {
        const t = tweens.current.get(id);
        if (!t) return null;
        return (
          <Animated.View
            key={id}
            style={[
              styles.actor,
              {
                opacity: t.opacity,
                transform: [
                  { translateX: t.x },
                  { translateY: t.y },
                  { scale: t.scale },
                  {
                    rotate: t.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {t.content}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // LTR pin: actor coordinates assume a left origin (RTL must not mirror them).
  layer: { ...StyleSheet.absoluteFillObject, direction: 'ltr' },
  // Actor anchored at top-left; x/y are translate offsets so content centers via marginLeft/Top below.
  actor: { position: 'absolute', left: 0, top: 0 },
});
