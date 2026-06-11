/* Deterministic level generation for Turbo Road.
   PURE module — no React / react-native imports; unit-testable in plain jest.

   Invariant (verified by __tests__/engine.test.ts): obstacles (cones/barrels)
   within one dist cluster always leave at least one lane free, and clusters
   are spaced far enough apart (> 2 × COLLISION_WINDOW) that they never merge
   into an impassable wall — the road is always passable. */

import {
  BASE_SPEED,
  COLLISION_WINDOW,
  MAX_BASE_SPEED,
  MAX_RACE_LENGTH,
  RACE_LENGTH_BASE,
  RACE_LENGTH_PER_LEVEL,
  RIVAL_EMOJI,
  SPEED_PER_LEVEL,
  THEME_ORDER,
} from '../constants';
import type { LaneIndex, LevelData, RivalProfile, RoadEntity } from '../types';

/** Small, fast seeded PRNG — same seed ⇒ same sequence ⇒ same level. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COIN_SPACING = 90; // world units between coins in a line
const ARC_SPACING = 100; // world units between coins in a cross-lane arc
const FIRST_ENTITY_DIST = 500; // breathing room after the start line
const FINISH_CLEARANCE = 350; // breathing room before the finish strip

export function generateLevel(level: number): LevelData {
  const rand = mulberry32(level);
  const lane = () => Math.floor(rand() * 3) as LaneIndex;

  const theme = THEME_ORDER[(level - 1) % THEME_ORDER.length];
  const baseSpeed = Math.min(
    BASE_SPEED + SPEED_PER_LEVEL * (level - 1),
    MAX_BASE_SPEED,
  );
  const raceLength = Math.min(
    RACE_LENGTH_BASE + RACE_LENGTH_PER_LEVEL * (level - 1),
    MAX_RACE_LENGTH,
  );

  const entities: RoadEntity[] = [];
  let nextId = 1;

  const start = FIRST_ENTITY_DIST;
  const end = raceLength - FINISH_CLEARANCE;

  /* Difficulty knobs: higher levels block two lanes more often and pack
     pattern groups closer together. Group gap stays well above
     2 × COLLISION_WINDOW so obstacle clusters can never merge. */
  const doubleObstacleChance = Math.min(0.25 + level * 0.06, 0.75);
  const groupGap = Math.max(220, 360 - level * 10);

  /* Alternate obstacle clusters and coin patterns so every level has a
     steady dodge → collect rhythm (a pure dice roll can starve a level of
     obstacles entirely); randomness stays in lanes, kinds and counts. */
  let cursor = start;
  let group = 0;
  while (cursor < end) {
    if (group % 2 === 0) {
      // Obstacle cluster: 1–2 distinct lanes blocked at the SAME dist,
      // so at least one lane is always free (passability invariant).
      const blocked: LaneIndex[] = [lane()];
      if (rand() < doubleObstacleChance) {
        const others = ([0, 1, 2] as LaneIndex[]).filter((l) => l !== blocked[0]);
        blocked.push(others[Math.floor(rand() * others.length)]);
      }
      for (const obstacleLane of blocked) {
        entities.push({
          id: nextId++,
          kind: rand() < 0.5 ? 'cone' : 'barrel',
          lane: obstacleLane,
          dist: cursor,
        });
      }
    } else if (rand() < 0.6) {
      // Short coin line in a single lane.
      const coinLane = lane();
      const count = 3 + Math.floor(rand() * 3); // 3..5
      for (let i = 0; i < count && cursor < end; i++) {
        entities.push({ id: nextId++, kind: 'coin', lane: coinLane, dist: cursor });
        cursor += COIN_SPACING;
      }
    } else {
      // Coin arc sweeping across all three lanes.
      const sweep: LaneIndex[] = rand() < 0.5 ? [0, 1, 2] : [2, 1, 0];
      for (const coinLane of sweep) {
        if (cursor >= end) break;
        entities.push({ id: nextId++, kind: 'coin', lane: coinLane, dist: cursor });
        cursor += ARC_SPACING;
      }
    }
    group += 1;
    cursor += groupGap + rand() * 120;
  }

  // 2–3 boost pads, spread along the road, nudged clear of obstacle clusters.
  const boostCount = rand() < 0.5 ? 2 : 3;
  for (let i = 0; i < boostCount; i++) {
    let dist =
      start + ((i + 1) / (boostCount + 1)) * (end - start) + (rand() - 0.5) * 160;
    while (
      entities.some(
        (e) =>
          (e.kind === 'cone' || e.kind === 'barrel') &&
          Math.abs(e.dist - dist) < COLLISION_WINDOW * 3,
      )
    ) {
      dist += COLLISION_WINDOW * 3;
    }
    entities.push({ id: nextId++, kind: 'boost', lane: lane(), dist });
  }

  entities.sort((a, b) => a.dist - b.dist);

  // Two rivals flanking the player's centre lane.
  const rivals: RivalProfile[] = RIVAL_EMOJI.map((emoji, i) => ({
    id: `rival-${i + 1}`,
    emoji,
    startLane: ((i * 2) % 3) as LaneIndex, // 0 and 2
    baseFactor: 0.9 + rand() * 0.08, // ≈0.9–0.98 — rubber band does the rest
    laneChangeEvery: 320 + Math.floor(rand() * 240),
  }));

  return { level, theme, raceLength, baseSpeed, entities, rivals };
}
