import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { ARCHER_X, GROUND_H, LANE_TOP, PHYSICS, POP_MS } from '../constants';
import { circleHit, clamp, starsFor, stepArrow } from '../utils/physics';
import type { Balloon, LevelData, World } from '../types';

const MAX_DT = 0.032; // cap dt so a paused/backgrounded frame can't teleport things
const now = () => Date.now();
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function makeWorld(data: LevelData): World {
  return {
    balloons: [],
    arrow: null,
    drawing: false,
    laneY: 0,
    nextId: 1,
    lastSpawn: 0,
    popped: 0,
    arrowsLeft: data.arrows,
    phase: 'aiming',
  };
}

// Balloons rise from the bottom, to the right of the archer, swaying gently.
function spawnBalloon(id: number, data: LevelData, width: number, groundY: number): Balloon {
  const r = rand(data.minR, data.maxR);
  const baseX = rand(width * 0.32, width - r - 24);
  return {
    id,
    baseX,
    x: baseX,
    y: groundY + r,
    r,
    color: data.colors[Math.floor(Math.random() * data.colors.length)],
    riseSpeed: data.riseSpeed * rand(0.85, 1.15),
    swayAmp: data.swayAmp * rand(0.6, 1.2),
    swaySpeed: rand(0.8, 1.6),
    swayPhase: rand(0, Math.PI * 2),
    popping: false,
    popAt: 0,
  };
}

type Params = {
  area: { width: number; height: number };
  data: LevelData;
  enabled: boolean;
  onShoot?: () => void;
  onPop: () => void;
  onCleared: (stars: number) => void;
  onFailed: () => void;
};

export function useArcheryGame({
  area,
  data,
  enabled,
  onShoot,
  onPop,
  onCleared,
  onFailed,
}: Params) {
  const world = useRef<World>(makeWorld(data));
  const [, setFrame] = useState(0);
  const [epoch, setEpoch] = useState(0); // bump to (re)start the loop on reset
  const tick = useCallback(() => setFrame((f) => (f + 1) % 1_000_000), []);

  // Latest dynamic values, read by the stable loop/PanResponder closures.
  const ref = useRef({ area, data, onShoot, onPop, onCleared, onFailed });
  ref.current = { area, data, onShoot, onPop, onCleared, onFailed };

  const archerX = useCallback(
    () => clamp(ref.current.area.width * ARCHER_X.ratio, ARCHER_X.min, ARCHER_X.max),
    [],
  );
  const groundY = useCallback(() => ref.current.area.height - GROUND_H, []);
  const clampLane = useCallback(
    (y: number) => clamp(y, LANE_TOP, groundY() - 12),
    [groundY],
  );

  const reset = useCallback(() => {
    const h = ref.current.area.height;
    world.current = makeWorld(ref.current.data);
    world.current.laneY = h > 0 ? (h - GROUND_H) / 2 : LANE_TOP;
    world.current.lastSpawn = now();
    setEpoch((e) => e + 1);
  }, []);

  // Fresh level → fresh world.
  useEffect(() => {
    reset();
  }, [data.level, reset]);

  // Settle the resting lane once we know the play area.
  useEffect(() => {
    const w = world.current;
    if (!w.drawing && area.height > 0) w.laneY = clampLane(w.laneY || (area.height - GROUND_H) / 2);
  }, [area.height, clampLane]);

  // Single rAF simulation loop. Runs while playing; self-stops once a level is
  // cleared or failed, and restarts on reset (epoch) / enable / resize.
  useEffect(() => {
    if (!enabled || area.width === 0) return;
    let raf = 0;
    let last = now();

    const resolve = (w: World) => {
      const d = ref.current.data;
      if (w.popped >= d.quota) {
        w.phase = 'cleared';
        ref.current.onCleared(starsFor(d.arrows - w.arrowsLeft, d.quota));
      } else if (w.arrowsLeft <= 0) {
        w.phase = 'failed';
        ref.current.onFailed();
      } else {
        w.phase = 'aiming';
      }
    };

    const update = (w: World, dt: number, t: number) => {
      const d = ref.current.data;
      const width = ref.current.area.width;
      const gy = groundY();

      // Balloons rise and sway.
      for (const b of w.balloons) {
        if (b.popping) continue;
        b.swayPhase += b.swaySpeed * dt;
        b.y -= b.riseSpeed * dt;
        b.x = b.baseX + Math.sin(b.swayPhase) * b.swayAmp;
      }
      // Cull escaped balloons (risen off the top) and finished pops.
      w.balloons = w.balloons.filter((b) =>
        b.popping ? t - b.popAt < POP_MS : b.y > -b.r - 30,
      );

      // Keep a steady supply of targets until the quota is met.
      const liveTargets = w.balloons.filter((b) => !b.popping).length;
      if (
        (w.phase === 'aiming' || w.phase === 'flying') &&
        w.popped < d.quota &&
        liveTargets < d.maxOnScreen &&
        t - w.lastSpawn > d.spawnEveryMs
      ) {
        w.balloons.push(spawnBalloon(w.nextId++, d, width, gy));
        w.lastSpawn = t;
      }

      // Arrow in flight (straight across).
      if (w.phase === 'flying' && w.arrow) {
        w.arrow = stepArrow(w.arrow, dt, 0);
        const tip = { x: w.arrow.x, y: w.arrow.y };
        let hit: Balloon | null = null;
        for (const b of w.balloons) {
          if (b.popping) continue;
          if (circleHit(tip, b.x, b.y, b.r)) {
            hit = b;
            break;
          }
        }
        if (hit) {
          hit.popping = true;
          hit.popAt = t;
          w.popped += 1;
          w.arrow = null;
          ref.current.onPop();
          resolve(w);
        } else if (w.arrow.x > width + 80) {
          w.arrow = null;
          resolve(w);
        }
      }
    };

    const frame = () => {
      const w = world.current;
      const t = now();
      const dt = Math.min((t - last) / 1000, MAX_DT);
      last = t;
      update(w, dt, t);
      tick();
      if (w.phase === 'aiming' || w.phase === 'flying') {
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [enabled, area.width, area.height, epoch, groundY, tick]);

  // Draw · Slide · Loose: hold to draw at a lane, slide to re-aim, release to fire.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => world.current.phase === 'aiming',
        onMoveShouldSetPanResponder: () => world.current.phase === 'aiming',
        onPanResponderGrant: (e) => {
          const w = world.current;
          if (w.phase !== 'aiming') return;
          w.drawing = true;
          w.laneY = clampLane(e.nativeEvent.locationY);
          tick();
        },
        onPanResponderMove: (e) => {
          const w = world.current;
          if (!w.drawing) return;
          w.laneY = clampLane(e.nativeEvent.locationY);
          tick();
        },
        onPanResponderRelease: () => {
          const w = world.current;
          if (w.phase === 'aiming' && w.drawing && w.arrowsLeft > 0) {
            w.arrow = { x: archerX() + 28, y: w.laneY, vx: PHYSICS.arrowSpeed, vy: 0 };
            w.arrowsLeft -= 1;
            w.phase = 'flying';
            ref.current.onShoot?.();
          }
          w.drawing = false;
          tick();
        },
        onPanResponderTerminate: () => {
          world.current.drawing = false;
          tick();
        },
      }),
    [archerX, clampLane, tick],
  );

  return {
    world: world.current,
    archerX: archerX(),
    panHandlers: responder.panHandlers,
    retry: reset,
  };
}
