/* Pure-engine unit tests for Turbo Road (no React / RN rendering needed). */

import {
  BOOST_FACTOR,
  COLLISION_WINDOW,
  COUNTDOWN_STEP_MS,
  HIT_FACTOR,
  LANE_SWITCH_MS,
  MAX_BASE_SPEED,
  MAX_RACE_LENGTH,
  RIVAL_MIN_GAP,
  RUBBER_BAND,
  SPEED_TAU_ACCEL,
  THEME_ORDER,
  VIEW_DIST,
} from '../constants';
import {
  createWorld,
  pauseWorld,
  requestLane,
  resumeWorld,
  steerTo,
  stepWorld,
  toSnapshot,
} from '../utils/engine';
import { generateLevel } from '../utils/levels';
import type { LevelData, RivalProfile, RoadEntity, WorldState } from '../types';

/* ---------- helpers ---------- */

const makeLevel = (overrides: Partial<LevelData> = {}): LevelData => ({
  level: 1,
  theme: 'meadow',
  raceLength: 4000,
  baseSpeed: 100,
  entities: [],
  rivals: [],
  traffic: [],
  ...overrides,
});

/** Create a world and run it through the countdown into the racing phase. */
const raceWorld = (level: LevelData): WorldState => {
  const world = createWorld(level);
  stepWorld(world, level, COUNTDOWN_STEP_MS * 3);
  expect(world.phase).toBe('racing');
  return world;
};

const rival = (overrides: Partial<RivalProfile> = {}): RivalProfile => ({
  id: 'rival-1',
  emoji: '🚙',
  startLane: 0,
  baseFactor: 0.95,
  laneChangeEvery: 1_000_000, // effectively never — keeps lane tests stable
  ...overrides,
});

/* ---------- 1. level generation ---------- */

describe('generateLevel', () => {
  it('is deterministic per level', () => {
    expect(generateLevel(1)).toEqual(generateLevel(1));
    expect(generateLevel(7)).toEqual(generateLevel(7));
  });

  it('grows difficulty with level and respects the caps', () => {
    const l1 = generateLevel(1);
    const l8 = generateLevel(8);
    expect(l8.baseSpeed).toBeGreaterThan(l1.baseSpeed);
    expect(l8.raceLength).toBeGreaterThan(l1.raceLength);

    const l99 = generateLevel(99);
    expect(l99.baseSpeed).toBeLessThanOrEqual(MAX_BASE_SPEED);
    expect(l99.raceLength).toBeLessThanOrEqual(MAX_RACE_LENGTH);
  });

  it('rotates themes and places 2-3 boost pads', () => {
    expect(generateLevel(1).theme).toBe(THEME_ORDER[0]);
    expect(generateLevel(2).theme).toBe(THEME_ORDER[1]);
    expect(generateLevel(5).theme).toBe(THEME_ORDER[0]); // wraps after 4

    for (const level of [1, 4, 9]) {
      const boosts = generateLevel(level).entities.filter((e) => e.kind === 'boost');
      expect(boosts.length).toBeGreaterThanOrEqual(2);
      expect(boosts.length).toBeLessThanOrEqual(3);
    }
  });
});

/* ---------- 2. passability invariant ---------- */

describe('passability', () => {
  it('leaves at least one free lane in every obstacle cluster (levels 1-10)', () => {
    for (let level = 1; level <= 10; level++) {
      const obstacles = generateLevel(level)
        .entities.filter((e) => e.kind === 'cone' || e.kind === 'barrel')
        .sort((a, b) => a.dist - b.dist);

      const clusters: RoadEntity[][] = [];
      for (const obstacle of obstacles) {
        const current = clusters[clusters.length - 1];
        if (
          current &&
          obstacle.dist - current[current.length - 1].dist <= COLLISION_WINDOW * 2
        ) {
          current.push(obstacle);
        } else {
          clusters.push([obstacle]);
        }
      }

      expect(clusters.length).toBeGreaterThan(0);
      for (const cluster of clusters) {
        const blockedLanes = new Set(cluster.map((o) => o.lane));
        expect(blockedLanes.size).toBeLessThan(3); // ≥1 lane always free
      }
    }
  });
});

/* ---------- countdown ---------- */

describe('countdown', () => {
  it('counts 3 → 2 → 1, then emits go exactly once', () => {
    const level = makeLevel();
    const world = createWorld(level);
    expect(world.phase).toBe('countdown');
    expect(toSnapshot(world, level).countdown).toBe('3');

    expect(stepWorld(world, level, COUNTDOWN_STEP_MS)).toEqual([]);
    expect(toSnapshot(world, level).countdown).toBe('2');
    expect(stepWorld(world, level, COUNTDOWN_STEP_MS)).toEqual([]);
    expect(toSnapshot(world, level).countdown).toBe('1');

    expect(stepWorld(world, level, COUNTDOWN_STEP_MS)).toEqual(['go']);
    expect(world.phase).toBe('racing');
    expect(toSnapshot(world, level).countdown).toBe('go');

    expect(stepWorld(world, level, COUNTDOWN_STEP_MS)).toEqual([]); // no second go
    expect(toSnapshot(world, level).countdown).toBeUndefined();
  });

  it('ignores discrete steering until racing starts', () => {
    const level = makeLevel();
    const world = createWorld(level);
    expect(requestLane(world, -1)).toBe(false);
    stepWorld(world, level, COUNTDOWN_STEP_MS * 3);
    expect(requestLane(world, -1)).toBe(true);
    expect(world.playerLane).toBe(0);
    expect(requestLane(world, -1)).toBe(false); // edge of the road
  });
});

/* ---------- continuous steering (finger-follow / tilt) ---------- */

describe('steerTo', () => {
  it('clamps the target to the road (0..2)', () => {
    const level = makeLevel();
    const world = raceWorld(level);
    steerTo(world, 7.5);
    expect(world.targetLaneX).toBe(2);
    steerTo(world, -3);
    expect(world.targetLaneX).toBe(0);
    expect(world.playerLane).toBe(0);
  });

  it('spring-follows the target: smooth start, settles without overshoot', () => {
    const level = makeLevel();
    const world = raceWorld(level);
    steerTo(world, 2);
    stepWorld(world, level, LANE_SWITCH_MS / 2);
    // Under way but not arrived (critically damped spring, no snapping)…
    expect(world.playerLaneX).toBeGreaterThan(1.05);
    expect(world.playerLaneX).toBeLessThan(1.95);
    expect(world.laneVel).toBeGreaterThan(0); // …and banking into the turn
    stepWorld(world, level, 1000);
    expect(world.playerLaneX).toBeCloseTo(2, 2); // settles…
    expect(world.playerLaneX).toBeLessThanOrEqual(2); // …never past the road
  });

  it('allows pre-positioning during the countdown', () => {
    const level = makeLevel();
    const world = createWorld(level);
    steerTo(world, 0);
    stepWorld(world, level, COUNTDOWN_STEP_MS); // still counting down
    expect(world.phase).toBe('countdown');
    expect(world.playerLaneX).toBeCloseTo(0, 2); // car already on the grid spot
  });

  it('is inert after the finish', () => {
    const level = makeLevel({ raceLength: 1 });
    const world = raceWorld(level);
    stepWorld(world, level, 1000); // crosses the finish line
    expect(world.phase).toBe('finished');
    steerTo(world, 0);
    expect(world.targetLaneX).toBe(1);
  });
});

/* ---------- 3. entity consumption ---------- */

describe('entity consumption', () => {
  // Player starts in lane 1 at dist 0; 100 units/s × 100 ms ⇒ dist 10,
  // so an entity at dist 30 is within COLLISION_WINDOW (40).
  const entityAt = (kind: RoadEntity['kind']): RoadEntity => ({
    id: 1,
    kind,
    lane: 1,
    dist: 30,
  });

  it('collects a coin on the player lane and emits coin', () => {
    const level = makeLevel({ entities: [entityAt('coin')] });
    const world = raceWorld(level);
    expect(stepWorld(world, level, 100)).toEqual(['coin']);
    expect(world.coins).toBe(1);
    expect(world.entities).toHaveLength(0);
  });

  it('ignores entities on other lanes', () => {
    const level = makeLevel({ entities: [{ ...entityAt('coin'), lane: 0 }] });
    const world = raceWorld(level);
    expect(stepWorld(world, level, 100)).toEqual([]);
    expect(world.coins).toBe(0);
    expect(world.entities).toHaveLength(1);
  });

  it('hits a cone: emits hit, shakes, and the brake bites fast', () => {
    const level = makeLevel({ entities: [entityAt('cone')] });
    const world = raceWorld(level);
    world.speed = level.baseSpeed; // cruising
    expect(stepWorld(world, level, 100)).toEqual(['hit']);
    expect(world.slowUntil).toBeGreaterThan(world.elapsed);
    expect(world.shake).toBeGreaterThan(0.5); // impact shake kicked
    stepWorld(world, level, 400); // SPEED_TAU_BRAKE ⇒ nearly settled
    expect(world.speed).toBeLessThan(level.baseSpeed * HIT_FACTOR * 1.15);
    expect(toSnapshot(world, level).slowActive).toBe(true);
  });

  it('takes a boost pad: emits boost and surges toward boost speed', () => {
    const level = makeLevel({ entities: [entityAt('boost')] });
    const world = raceWorld(level);
    world.speed = level.baseSpeed; // cruising
    expect(stepWorld(world, level, 100)).toEqual(['boost']);
    expect(world.boostUntil).toBeGreaterThan(world.elapsed);
    stepWorld(world, level, 1000); // ramps up (SPEED_TAU_ACCEL), window 2s
    expect(world.speed).toBeGreaterThan(level.baseSpeed * 1.3);
    expect(world.speed).toBeLessThanOrEqual(level.baseSpeed * BOOST_FACTOR);
    expect(toSnapshot(world, level).boostActive).toBe(true);
  });

  it('post-hit grace: a second cone right after a crash is forgiven', () => {
    const cone1 = { id: 1, kind: 'cone' as const, lane: 1 as const, dist: 30 };
    const cone2 = { id: 2, kind: 'cone' as const, lane: 1 as const, dist: 40 };
    const level = makeLevel({ entities: [cone1, cone2] });
    const world = raceWorld(level);
    world.speed = level.baseSpeed;
    expect(stepWorld(world, level, 100)).toEqual(['hit']); // cone1 crashes
    expect(stepWorld(world, level, 100)).toEqual([]); // cone2 inside grace
    expect(world.hits).toBe(1);
    expect(world.entities.map((e) => e.id)).toEqual([2]); // cone2 untouched
  });

  it('shield: picked up, shown held, absorbs the next hit', () => {
    const shield = { id: 1, kind: 'shield' as const, lane: 1 as const, dist: 30 };
    const cone = { id: 2, kind: 'cone' as const, lane: 1 as const, dist: 300 };
    const level = makeLevel({ entities: [shield, cone] });
    const world = raceWorld(level);
    world.speed = level.baseSpeed;
    expect(stepWorld(world, level, 100)).toEqual(['shield']);
    expect(world.shield).toBe(1);

    // Drive into the cone: absorbed, no slowdown, no hit counted.
    world.dist = cone.dist - 20;
    expect(stepWorld(world, level, 50)).toEqual(['shieldBlock']);
    expect(world.shield).toBe(0);
    expect(world.hits).toBe(0);
    expect(world.slowUntil).toBe(0);
  });

  it('magnet: collects coins from a neighboring lane while active', () => {
    const magnet = { id: 1, kind: 'magnet' as const, lane: 1 as const, dist: 30 };
    const farCoin = { id: 2, kind: 'coin' as const, lane: 0 as const, dist: 300 };
    const level = makeLevel({ entities: [magnet, farCoin] });
    const world = raceWorld(level);
    world.speed = level.baseSpeed;
    expect(stepWorld(world, level, 100)).toEqual(['magnet']);

    // Lane 0 coin, player in lane 1 — out of normal reach, magnet grabs it.
    world.dist = farCoin.dist - 20;
    expect(stepWorld(world, level, 50)).toEqual(['coin']);
    expect(world.coins).toBe(1);
  });
});

/* ---------- pause / resume ---------- */

describe('pause & resume', () => {
  it('freezes the world while paused and resumes through a countdown beat', () => {
    const level = makeLevel();
    const world = raceWorld(level);
    world.speed = level.baseSpeed;
    stepWorld(world, level, 100);
    const distAtPause = world.dist;

    pauseWorld(world);
    expect(world.phase).toBe('paused');
    expect(stepWorld(world, level, 5000)).toEqual([]); // inert
    expect(world.dist).toBe(distAtPause);

    resumeWorld(world);
    expect(world.phase).toBe('countdown');
    expect(toSnapshot(world, level).countdown).toBe('1'); // one beat
    expect(stepWorld(world, level, COUNTDOWN_STEP_MS)).toEqual(['go']);
    expect(world.phase).toBe('racing');
    expect(world.dist).toBe(distAtPause); // no teleport across the pause
  });

  it('only racing can pause; only paused can resume', () => {
    const level = makeLevel();
    const world = createWorld(level);
    pauseWorld(world); // still in countdown — ignored
    expect(world.phase).toBe('countdown');
    resumeWorld(world); // not paused — ignored
    expect(world.phase).toBe('countdown');
  });
});

/* ---------- oncoming traffic ---------- */

describe('oncoming traffic', () => {
  const truckLevel = (overrides: Partial<LevelData> = {}) =>
    makeLevel({
      traffic: [
        { id: 'truck-1', startLane: 1, gapAhead: 400, speedFactor: 0.5 },
      ],
      ...overrides,
    });

  it('approaches the player faster than the road scrolls', () => {
    const level = truckLevel();
    const world = raceWorld(level);
    world.speed = level.baseSpeed;
    world.launch = 1;
    const gapBefore = world.traffic[0].dist - world.dist;
    stepWorld(world, level, 500);
    const gapAfter = world.traffic[0].dist - world.dist;
    // Closing speed = player speed + truck speed > player speed alone.
    expect(gapBefore - gapAfter).toBeGreaterThan(world.speed * 0.5 * 0.99);
  });

  it('crashing into a truck behaves like an obstacle hit', () => {
    const level = truckLevel();
    const world = raceWorld(level);
    world.speed = level.baseSpeed;
    world.traffic[0].dist = world.dist + 20; // right on the bumper
    expect(stepWorld(world, level, 50)).toEqual(['hit']);
    expect(world.hits).toBe(1);
  });

  it('recycles ahead after being passed, in a new deterministic lane', () => {
    const level = truckLevel();
    const world = raceWorld(level);
    world.traffic[0].dist = world.dist - 300; // already far behind
    stepWorld(world, level, 50);
    expect(world.traffic[0].dist).toBeGreaterThan(world.dist + VIEW_DIST);
    expect(world.traffic[0].respawns).toBe(1);
  });
});

describe('between-lane collisions', () => {
  it('a hit between lanes counts only when actually touching', () => {
    // Player parked between lanes 1 and 2 (laneX 1.5): a cone in lane 2 is
    // 0.5 lanes away — outside LATERAL_OBSTACLE — but a coin still collects.
    const cone = { id: 1, kind: 'cone' as const, lane: 2 as const, dist: 30 };
    const coin = { id: 2, kind: 'coin' as const, lane: 2 as const, dist: 30 };
    const level = makeLevel({ entities: [cone, coin] });
    const world = raceWorld(level);
    world.playerLaneX = 1.5;
    world.targetLaneX = 1.5;
    expect(stepWorld(world, level, 100)).toEqual(['coin']);
    expect(world.entities.map((e) => e.id)).toEqual([1]); // cone untouched
  });
});

/* ---------- rival separation (anti-stacking) ---------- */

describe('rival separation', () => {
  it('same-lane crowding: trailing rival changes lane and keeps a gap', () => {
    const level = makeLevel({
      rivals: [
        rival({ id: 'a', startLane: 1 }),
        rival({ id: 'b', startLane: 1 }),
      ],
    });
    const world = raceWorld(level);
    world.launch = 1;
    // Both in lane 1 at (nearly) the same dist — the stacking blob.
    world.rivals[0].dist = 500;
    world.rivals[1].dist = 495;

    stepWorld(world, level, 50);

    const [a, b] = world.rivals;
    expect(a.lane).not.toBe(b.lane); // pulled apart laterally…
    expect(Math.abs(a.dist - b.dist)).toBeGreaterThanOrEqual(RIVAL_MIN_GAP); // …and longitudinally
  });

  it('the lane fix is persistent (no flicker on the next frame)', () => {
    const level = makeLevel({
      rivals: [
        rival({ id: 'a', startLane: 1 }),
        rival({ id: 'b', startLane: 1 }),
      ],
    });
    const world = raceWorld(level);
    world.launch = 1;
    world.rivals[0].dist = 500;
    world.rivals[1].dist = 495;
    stepWorld(world, level, 50);
    const lanesAfterFix = world.rivals.map((r) => r.lane);
    stepWorld(world, level, 50);
    expect(world.rivals.map((r) => r.lane)).toEqual(lanesAfterFix);
  });
});

/* ---------- race duration sanity ---------- */

describe('race duration', () => {
  it('every level lasts roughly 25-60s at cruise speed (no 5-second races)', () => {
    for (let lvl = 1; lvl <= 30; lvl++) {
      const level = generateLevel(lvl);
      const seconds = level.raceLength / level.baseSpeed;
      expect(seconds).toBeGreaterThan(25);
      expect(seconds).toBeLessThan(60);
    }
  });
});

/* ---------- 4. rubber banding ---------- */

describe('rubber banding', () => {
  it('slows rivals far ahead and speeds up rivals far behind', () => {
    const level = makeLevel({
      rivals: [
        rival({ id: 'ahead', startLane: 0 }),
        rival({ id: 'behind', startLane: 2 }),
      ],
    });
    const world = raceWorld(level);
    world.rivals[0].dist = world.dist + RUBBER_BAND.window * 2; // far ahead
    world.rivals[1].dist = world.dist - RUBBER_BAND.window * 2; // far behind

    const before = world.rivals.map((r) => r.dist);
    stepWorld(world, level, 100);
    const aheadDelta = world.rivals[0].dist - before[0];
    const behindDelta = world.rivals[1].dist - before[1];

    // Neutral per-step distance for baseFactor 0.95 over 100 ms, scaled by
    // the shared launch ramp (the whole grid accelerates off the line).
    const launch = 1 - Math.exp(-0.1 / SPEED_TAU_ACCEL);
    const neutral = level.baseSpeed * 0.95 * 0.1 * launch;
    expect(aheadDelta).toBeLessThan(neutral); // factor < 1
    expect(behindDelta).toBeGreaterThan(neutral); // factor > 1
    expect(aheadDelta).toBeCloseTo(neutral * RUBBER_BAND.slow, 5);
    expect(behindDelta).toBeCloseTo(neutral * RUBBER_BAND.catchUp, 5);
  });
});

/* ---------- 5. finishing ---------- */

describe('finish', () => {
  it('flips to finished, emits finish and computes the place', () => {
    const level = makeLevel({
      raceLength: 200,
      rivals: [rival({ id: 'ahead' })],
    });
    const world = raceWorld(level);
    world.rivals[0].dist = 5000; // stays ahead through the finish
    world.speed = level.baseSpeed; // cruising

    const events = stepWorld(world, level, 2000); // 100 u/s × 2 s = 200 ≥ 200
    expect(events).toContain('finish');
    expect(world.phase).toBe('finished');
    expect(world.dist).toBe(level.raceLength);
    expect(world.place).toBe(2);
    expect(toSnapshot(world, level).progress).toBe(1);

    // A finished world is inert.
    expect(stepWorld(world, level, 1000)).toEqual([]);
    expect(world.dist).toBe(level.raceLength);
  });

  it('wins with place 1 when no rival is ahead', () => {
    const level = makeLevel({ raceLength: 200 });
    const world = raceWorld(level);
    world.speed = level.baseSpeed; // cruising
    expect(stepWorld(world, level, 2000)).toEqual(['finish']);
    expect(world.place).toBe(1);
  });
});
