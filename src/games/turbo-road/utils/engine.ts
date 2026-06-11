/* Turbo Road race engine.
   PURE module — no React / react-native imports; unit-testable in plain jest.

   The hook (hooks/useRaceGame.ts) owns a mutable WorldState in a ref, calls
   stepWorld() once per rAF frame, plays sounds from the returned events and
   publishes ONE immutable RaceSnapshot per frame via toSnapshot(). */

import {
  BOOST_FACTOR,
  BOOST_MS,
  COLLISION_WINDOW,
  COUNTDOWN_STEP_MS,
  HIT_FACTOR,
  HIT_MS,
  LATERAL_OBSTACLE,
  LATERAL_PICKUP,
  PLAYER_Y_RATIO,
  RIVAL_LANE_MS,
  RUBBER_BAND,
  SHAKE_TAU,
  SPEED_TAU_ACCEL,
  SPEED_TAU_BRAKE,
  STEER_OMEGA,
  VIEW_DIST,
} from '../constants';
import type {
  GameEvent,
  LaneIndex,
  LevelData,
  RaceSnapshot,
  VisibleEntity,
  VisibleRival,
  WorldState,
} from '../types';

/** Countdown shows 3 → 2 → 1 (then GO! once racing starts). */
const COUNTDOWN_STEPS = 3;
const COUNTDOWN_LABELS = ['3', '2', '1'] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Triangle-bounce a step index into a lane: …0,1,2,1,0,1,2… — consecutive
    values always differ by exactly one lane, so rivals never teleport. */
function bounceLane(x: number): LaneIndex {
  const p = ((x % 4) + 4) % 4;
  return (p === 3 ? 1 : p) as LaneIndex;
}

export function createWorld(level: LevelData): WorldState {
  return {
    phase: 'countdown',
    elapsed: 0,
    playerLane: 1,
    playerLaneX: 1,
    targetLaneX: 1,
    laneVel: 0,
    shake: 0,
    dist: 0,
    speed: 0,
    boostUntil: 0,
    slowUntil: 0,
    coins: 0,
    rivals: level.rivals.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      lane: r.startLane,
      laneX: r.startLane,
      dist: 0,
    })),
    // Copy entities so consuming them never mutates the (reusable) LevelData.
    entities: level.entities.map((e) => ({ ...e })),
    place: 1,
  };
}

/** Continuous steering: set the lane position the car eases toward (0..2).
    Fed every input event by finger-follow drag or tilt; accepted during the
    countdown too so kids can pre-position on the grid. */
export function steerTo(world: WorldState, lane: number): void {
  if (world.phase === 'finished') return;
  const target = Math.min(2, Math.max(0, lane));
  world.targetLaneX = target;
  world.playerLane = Math.round(target) as LaneIndex;
}

/** Discrete one-lane step (kept for taps/tests). Returns true when accepted;
    rendering spring-follows via playerLaneX. */
export function requestLane(world: WorldState, dir: -1 | 1): boolean {
  if (world.phase !== 'racing') return false;
  const target = Math.round(world.targetLaneX) + dir;
  if (target < 0 || target > 2) return false;
  steerTo(world, target);
  return true;
}

/** Advance the simulation by dtMs (mutates world) and return the events
    that happened this step. Caller clamps dt (background frames). */
export function stepWorld(
  world: WorldState,
  level: LevelData,
  dtMs: number,
): GameEvent[] {
  const events: GameEvent[] = [];
  if (world.phase === 'finished') return events;

  world.elapsed += dtMs;
  const dt = dtMs / 1000;

  // Steering: critically-damped spring chasing targetLaneX. Sub-stepped
  // semi-implicit Euler so the integration stays stable for ANY dt the
  // caller passes (the hook clamps to 50ms; tests step whole seconds).
  // Lateral velocity is kept on the world so the renderer can bank the car
  // into turns. Runs during the countdown too (grid pre-positioning).
  let rem = dt;
  while (rem > 1e-9) {
    const h = Math.min(rem, 0.02);
    const accel =
      STEER_OMEGA * STEER_OMEGA * (world.targetLaneX - world.playerLaneX) -
      2 * STEER_OMEGA * world.laneVel;
    world.laneVel += accel * h;
    world.playerLaneX += world.laneVel * h;
    rem -= h;
  }
  // The spring never overshoots the road, but guard against clamp drift.
  if (world.playerLaneX < 0) {
    world.playerLaneX = 0;
    world.laneVel = Math.max(0, world.laneVel);
  } else if (world.playerLaneX > 2) {
    world.playerLaneX = 2;
    world.laneVel = Math.min(0, world.laneVel);
  }

  // Impact shake decays exponentially.
  world.shake *= Math.exp(-dt / SHAKE_TAU);

  if (world.phase === 'countdown') {
    if (world.elapsed >= COUNTDOWN_STEP_MS * COUNTDOWN_STEPS) {
      world.phase = 'racing';
      events.push('go');
    }
    return events;
  }

  /* ---------- racing ---------- */

  // Speed dynamics: approach the target speed instead of snapping — the car
  // launches off the line, surges into a boost and bites hard on a hit.
  const boosted = world.elapsed < world.boostUntil;
  const slowed = world.elapsed < world.slowUntil;
  const targetSpeed =
    level.baseSpeed * (boosted ? BOOST_FACTOR : slowed ? HIT_FACTOR : 1);
  const tau = targetSpeed < world.speed ? SPEED_TAU_BRAKE : SPEED_TAU_ACCEL;
  world.speed += (targetSpeed - world.speed) * (1 - Math.exp(-dt / tau));
  world.dist += world.speed * dt;

  // Shared launch ramp so the whole grid accelerates off the line together.
  const racingTime =
    (world.elapsed - COUNTDOWN_STEP_MS * COUNTDOWN_STEPS) / 1000;
  const launch = 1 - Math.exp(-Math.max(0, racingTime) / SPEED_TAU_ACCEL);

  // Rivals: base factor × rubber band × launch, deterministic bouncing lane
  // changes — and an eased laneX so a lane change is a glide, not a teleport.
  for (let i = 0; i < world.rivals.length; i++) {
    const rival = world.rivals[i];
    const profile = level.rivals[i];
    if (!profile) continue;
    const gap = rival.dist - world.dist;
    const strength = Math.min(Math.abs(gap) / RUBBER_BAND.window, 1);
    const band =
      gap > 0
        ? lerp(1, RUBBER_BAND.slow, strength)
        : lerp(1, RUBBER_BAND.catchUp, strength);
    rival.dist += level.baseSpeed * profile.baseFactor * band * launch * dt;
    rival.lane = bounceLane(
      profile.startLane + Math.floor(rival.dist / profile.laneChangeEvery),
    );
    const dRival = rival.lane - rival.laneX;
    const maxMove = dtMs / RIVAL_LANE_MS;
    rival.laneX += Math.abs(dRival) <= maxMove ? dRival : Math.sign(dRival) * maxMove;
  }

  // Consume entities by CONTINUOUS overlap: the car hits what it visually
  // touches — forgiving for obstacles, generous for pickups.
  for (let i = world.entities.length - 1; i >= 0; i--) {
    const e = world.entities[i];
    if (Math.abs(e.dist - world.dist) > COLLISION_WINDOW) continue;
    const lateral = Math.abs(e.lane - world.playerLaneX);
    const isPickup = e.kind === 'coin' || e.kind === 'boost';
    if (lateral > (isPickup ? LATERAL_PICKUP : LATERAL_OBSTACLE)) continue;
    world.entities.splice(i, 1);
    if (e.kind === 'coin') {
      world.coins += 1;
      events.push('coin');
    } else if (e.kind === 'boost') {
      world.boostUntil = world.elapsed + BOOST_MS;
      world.slowUntil = 0;
      events.push('boost');
    } else {
      // cone | barrel
      world.slowUntil = world.elapsed + HIT_MS;
      world.boostUntil = 0;
      world.shake = 1;
      events.push('hit');
    }
  }

  // Place = 1 + rivals ahead of the player.
  let ahead = 0;
  for (const rival of world.rivals) if (rival.dist > world.dist) ahead += 1;
  world.place = Math.min(1 + ahead, 3) as 1 | 2 | 3;

  if (world.dist >= level.raceLength) {
    world.dist = level.raceLength;
    world.phase = 'finished';
    world.speed = 0;
    events.push('finish');
  }

  return events;
}

/** Map a world distance to a playfield yRatio: the player anchors at
    PLAYER_Y_RATIO and dist + VIEW_DIST reaches the horizon (yRatio 0). */
function yRatioFor(entityDist: number, playerDist: number): number {
  return PLAYER_Y_RATIO * (1 - (entityDist - playerDist) / VIEW_DIST);
}

const Y_MIN = -0.05; // just above the horizon
const Y_MAX = 1.08; // just below the bottom edge (scroll-off)

/** Project the mutable world into the immutable per-frame view model. */
export function toSnapshot(world: WorldState, level: LevelData): RaceSnapshot {
  let countdown: string | undefined;
  if (world.phase === 'countdown') {
    const step = Math.min(
      Math.floor(world.elapsed / COUNTDOWN_STEP_MS),
      COUNTDOWN_STEPS - 1,
    );
    countdown = COUNTDOWN_LABELS[step];
  } else if (
    world.phase === 'racing' &&
    world.elapsed < COUNTDOWN_STEP_MS * (COUNTDOWN_STEPS + 1)
  ) {
    countdown = 'go'; // GO! flashes through the first racing beat
  }

  const entities: VisibleEntity[] = [];
  for (const e of world.entities) {
    const yRatio = yRatioFor(e.dist, world.dist);
    if (yRatio < Y_MIN || yRatio > Y_MAX) continue;
    entities.push({ id: e.id, kind: e.kind, lane: e.lane, yRatio });
  }

  const rivals: VisibleRival[] = [];
  for (const r of world.rivals) {
    const yRatio = yRatioFor(r.dist, world.dist);
    if (yRatio < Y_MIN || yRatio > Y_MAX) continue;
    rivals.push({ id: r.id, emoji: r.emoji, lane: r.lane, laneX: r.laneX, yRatio });
  }

  const racing = world.phase === 'racing';
  return {
    phase: world.phase,
    countdown,
    playerLane: world.playerLane,
    playerLaneX: world.playerLaneX,
    progress: Math.min(world.dist / level.raceLength, 1),
    dist: world.dist,
    place: world.place,
    coins: world.coins,
    boostActive: racing && world.elapsed < world.boostUntil,
    slowActive: racing && world.elapsed < world.slowUntil,
    entities,
    rivals,
  };
}
