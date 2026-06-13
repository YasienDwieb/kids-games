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
  GRACE_MS,
  HIT_FACTOR,
  HIT_MS,
  LATERAL_OBSTACLE,
  LATERAL_PICKUP,
  MAGNET_LATERAL,
  MAGNET_MS,
  MAGNET_WINDOW,
  PLAYER_Y_RATIO,
  RESUME_COUNTDOWN_MS,
  RIVAL_LANE_MS,
  RIVAL_MIN_GAP,
  RUBBER_BAND,
  SHAKE_TAU,
  SHIELD_GRACE_MS,
  SPEED_TAU_ACCEL,
  SPEED_TAU_BRAKE,
  STEER_OMEGA,
  TRAFFIC_RESPAWN_BEHIND,
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Triangle-bounce a step index into a lane: …0,1,2,1,0,1,2… — consecutive
    values always differ by exactly one lane, so rivals never teleport. */
function bounceLane(x: number): LaneIndex {
  const p = ((x % 4) + 4) % 4;
  return (p === 3 ? 1 : p) as LaneIndex;
}

/** An obstacle (cone/barrel/truck) reached the car: the shield absorbs it
    when held, otherwise brake + shake; either way a grace window opens so
    hits never chain. Returns the event to emit. */
function applyObstacleHit(world: WorldState): GameEvent {
  if (world.shield > 0) {
    world.shield -= 1;
    world.graceUntil = world.elapsed + SHIELD_GRACE_MS;
    world.shake = 0.45; // a thump, not a crash
    return 'shieldBlock';
  }
  world.slowUntil = world.elapsed + HIT_MS;
  world.boostUntil = 0;
  world.shake = 1;
  world.hits += 1;
  world.graceUntil = world.elapsed + GRACE_MS;
  return 'hit';
}

export function createWorld(
  level: LevelData,
  opts: { grip?: number } = {},
): WorldState {
  const countdownUntil = COUNTDOWN_STEP_MS * COUNTDOWN_STEPS;
  return {
    phase: 'countdown',
    elapsed: 0,
    playerLane: 1,
    playerLaneX: 1,
    targetLaneX: 1,
    laneVel: 0,
    shake: 0,
    grip: opts.grip ?? 1,
    dist: 0,
    speed: 0,
    boostUntil: 0,
    slowUntil: 0,
    countdownUntil,
    goFlashUntil: countdownUntil + COUNTDOWN_STEP_MS,
    graceUntil: 0,
    launch: 0,
    shield: 0,
    magnetUntil: 0,
    coins: 0,
    hits: 0,
    boosts: 0,
    rivals: level.rivals.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      lane: r.startLane,
      laneX: r.startLane,
      laneShift: 0,
      dist: 0,
    })),
    traffic: level.traffic.map((t) => ({
      id: t.id,
      lane: t.startLane,
      dist: t.gapAhead,
      respawns: 0,
    })),
    // Copy entities so consuming them never mutates the (reusable) LevelData.
    entities: level.entities.map((e) => ({ ...e })),
    place: 1,
  };
}

/** Pause an in-flight race (no-op in any other phase). */
export function pauseWorld(world: WorldState): void {
  if (world.phase === 'racing') world.phase = 'paused';
}

/** Resume from pause through a single countdown beat ("1" → GO!). */
export function resumeWorld(world: WorldState): void {
  if (world.phase !== 'paused') return;
  world.phase = 'countdown';
  world.countdownUntil = world.elapsed + RESUME_COUNTDOWN_MS;
  world.goFlashUntil = world.countdownUntil + COUNTDOWN_STEP_MS;
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
  if (world.phase === 'finished' || world.phase === 'paused') return events;

  world.elapsed += dtMs;
  const dt = dtMs / 1000;

  // Steering: critically-damped spring chasing targetLaneX, scaled by the
  // car's grip stat. Sub-stepped semi-implicit Euler so the integration
  // stays stable for ANY dt the caller passes (the hook clamps to 50ms;
  // tests step whole seconds). Lateral velocity is kept on the world so the
  // renderer can bank the car into turns. Runs during the countdown too
  // (grid pre-positioning).
  const omega = STEER_OMEGA * world.grip;
  let rem = dt;
  while (rem > 1e-9) {
    const h = Math.min(rem, 0.02);
    const accel =
      omega * omega * (world.targetLaneX - world.playerLaneX) -
      2 * omega * world.laneVel;
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
    if (world.elapsed >= world.countdownUntil) {
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

  // Shared launch ramp so the whole grid accelerates off the line together
  // (stateful, so pausing/resuming doesn't reset the rivals' pace).
  world.launch += (1 - world.launch) * (1 - Math.exp(-dt / SPEED_TAU_ACCEL));

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
    rival.dist += level.baseSpeed * profile.baseFactor * band * world.launch * dt;
    rival.lane = bounceLane(
      profile.startLane +
        Math.floor(rival.dist / profile.laneChangeEvery) +
        rival.laneShift,
    );
  }

  // Anti-stacking: both rivals rubber-band toward the player, so they
  // naturally converge — when they crowd into the same lane, the trailing
  // one slides out (persistently, via laneShift) and is held at a minimum
  // following gap so they never read as one blob.
  for (let i = 0; i < world.rivals.length; i++) {
    for (let j = i + 1; j < world.rivals.length; j++) {
      const a = world.rivals[i];
      const b = world.rivals[j];
      if (a.lane !== b.lane) continue;
      if (Math.abs(a.dist - b.dist) > RIVAL_MIN_GAP) continue;
      const lead = a.dist >= b.dist ? a : b;
      const trail = lead === a ? b : a;
      const trailProfile = level.rivals[world.rivals.indexOf(trail)];
      let guard = 0;
      while (trail.lane === lead.lane && trailProfile && guard < 3) {
        trail.laneShift += 1;
        trail.lane = bounceLane(
          trailProfile.startLane +
            Math.floor(trail.dist / trailProfile.laneChangeEvery) +
            trail.laneShift,
        );
        guard += 1;
      }
      trail.dist = Math.min(trail.dist, lead.dist - RIVAL_MIN_GAP);
    }
  }

  // Eased rendering position — a lane change is a glide, not a teleport.
  for (const rival of world.rivals) {
    const dRival = rival.lane - rival.laneX;
    const maxMove = dtMs / RIVAL_LANE_MS;
    rival.laneX += Math.abs(dRival) <= maxMove ? dRival : Math.sign(dRival) * maxMove;
  }

  // Oncoming traffic: trucks drive TOWARD the player and recycle ahead once
  // passed (deterministic lanes via the bounce sequence).
  for (let i = 0; i < world.traffic.length; i++) {
    const truck = world.traffic[i];
    const profile = level.traffic[i];
    if (!profile) continue;
    truck.dist -= level.baseSpeed * profile.speedFactor * world.launch * dt;
    if (truck.dist < world.dist - TRAFFIC_RESPAWN_BEHIND) {
      truck.respawns += 1;
      truck.dist = world.dist + VIEW_DIST + 200 + i * 320;
      truck.lane = bounceLane(profile.startLane + truck.respawns);
    }
  }

  const graced = world.elapsed < world.graceUntil;

  // Truck collisions: same rules as static obstacles (grace/shield apply),
  // but the truck survives the crash and drives on.
  if (!graced) {
    for (const truck of world.traffic) {
      if (Math.abs(truck.dist - world.dist) > COLLISION_WINDOW) continue;
      if (Math.abs(truck.lane - world.playerLaneX) > LATERAL_OBSTACLE) continue;
      events.push(applyObstacleHit(world));
      break; // one crash per frame is plenty
    }
  }

  // Consume entities by CONTINUOUS overlap: the car hits what it visually
  // touches — forgiving for obstacles, generous for pickups. An active
  // magnet widens the coin geometry so neighboring-lane coins snap in.
  // Forward order matters: entities are dist-sorted, so the NEAREST one in
  // the window is touched first (its grace then forgives the next).
  const magnetized = world.elapsed < world.magnetUntil;
  for (let i = 0; i < world.entities.length; i++) {
    const e = world.entities[i];
    const isPickup = e.kind !== 'cone' && e.kind !== 'barrel';
    const window =
      magnetized && e.kind === 'coin'
        ? Math.max(COLLISION_WINDOW, MAGNET_WINDOW)
        : COLLISION_WINDOW;
    if (Math.abs(e.dist - world.dist) > window) continue;
    const lateral = Math.abs(e.lane - world.playerLaneX);
    const reach =
      magnetized && e.kind === 'coin'
        ? MAGNET_LATERAL
        : isPickup
          ? LATERAL_PICKUP
          : LATERAL_OBSTACLE;
    if (lateral > reach) continue;
    // Post-hit forgiveness — read live: a truck crash this same frame must
    // not be doubled by a cone.
    if (!isPickup && world.elapsed < world.graceUntil) continue;
    world.entities.splice(i, 1);
    i -= 1; // account for the removal while iterating forward
    if (e.kind === 'coin') {
      world.coins += 1;
      events.push('coin');
    } else if (e.kind === 'boost') {
      world.boostUntil = world.elapsed + BOOST_MS;
      world.slowUntil = 0;
      world.boosts += 1;
      events.push('boost');
    } else if (e.kind === 'shield') {
      world.shield = 1; // holds one charge
      events.push('shield');
    } else if (e.kind === 'magnet') {
      world.magnetUntil = world.elapsed + MAGNET_MS;
      events.push('magnet');
    } else {
      // cone | barrel
      events.push(applyObstacleHit(world));
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
    const beatsLeft = Math.ceil((world.countdownUntil - world.elapsed) / COUNTDOWN_STEP_MS);
    countdown = String(Math.min(Math.max(beatsLeft, 1), COUNTDOWN_STEPS));
  } else if (world.phase === 'racing' && world.elapsed < world.goFlashUntil) {
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
