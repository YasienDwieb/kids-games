import { ACCENTS } from '@/sdk';
import type { CarDef, RoadTheme, ThemeId, TrimDef } from './types';

/* ---------------- gameplay tuning ---------------- */

export const LANES = 3;

/** World units visible ahead of the player (maps to playfield height). */
export const VIEW_DIST = 900;

/** Player car vertical anchor as a ratio of playfield height (0=top). */
export const PLAYER_Y_RATIO = 0.78;

export const BASE_SPEED = 260; // units/sec at level 1
export const SPEED_PER_LEVEL = 14;
export const MAX_BASE_SPEED = 520;

export const BOOST_FACTOR = 1.6;
export const BOOST_MS = 2000;
export const HIT_FACTOR = 0.45;
export const HIT_MS = 1400;

export const RACE_LENGTH_BASE = 2600;
export const RACE_LENGTH_PER_LEVEL = 250;
export const MAX_RACE_LENGTH = 6000;

/** 3 → 2 → 1 → GO!; one step per COUNTDOWN_STEP_MS. */
export const COUNTDOWN_STEP_MS = 800;
/** Resuming from pause replays a single countdown beat ("1" → GO!). */
export const RESUME_COUNTDOWN_MS = 800;

/** Post-hit grace: obstacles can't chain-hit while this window is active. */
export const GRACE_MS = 1600;
/** Brief grace after a shield absorbs a hit. */
export const SHIELD_GRACE_MS = 800;

/** Magnet power-up: duration and the widened coin-collection geometry. */
export const MAGNET_MS = 6000;
export const MAGNET_LATERAL = 1.6; // lanes — pulls coins from neighbors
export const MAGNET_WINDOW = 100; // dist window while magnetized

/** Oncoming trucks (the 8-12 challenge layer). */
export const TRAFFIC_MIN_LEVEL = 6;
export const TRAFFIC_SPEED_FACTOR = 0.45; // their speed vs level base speed
export const TRAFFIC_RESPAWN_BEHIND = 250; // recycle once this far behind

/** The win overlay waits this long so the finish-line moment can play. */
export const FINISH_CELEBRATION_MS = 1100;

export const LANE_SWITCH_MS = 160;

/* ---- steering & motion dynamics (the "feel") ---- */

/** Critically-damped steering spring (rad/s): higher = snappier follow. */
export const STEER_OMEGA = 11;
/** Car banking: degrees of visual tilt per (lane/sec) of lateral velocity. */
export const BANK_PER_LANE_VEL = 3.2;
export const BANK_MAX_DEG = 16;

/** Continuous collision: lateral overlap (in lanes) that counts as a hit. */
export const LATERAL_OBSTACLE = 0.42; // forgiving — must really touch a cone
export const LATERAL_PICKUP = 0.58; // generous — near-miss coins still collect

/** Speed dynamics: world.speed approaches its target with these time
    constants (seconds) instead of snapping. */
export const SPEED_TAU_ACCEL = 0.55; // launch / recover / reach boost
export const SPEED_TAU_BRAKE = 0.12; // hitting an obstacle bites instantly

/** Impact shake: decay time constant (s) of the post-hit camera shake. */
export const SHAKE_TAU = 0.35;
export const SHAKE_FREQ = 55; // rad/s of the shake oscillation

/** Rivals ease between lanes at one lane per this many ms (no teleporting). */
export const RIVAL_LANE_MS = 260;

/** Tilt steering: gravity (g units) along screen-right for FULL deflection
    (center lane → edge lane). ≈16° of phone tilt. */
export const TILT_FULL = 0.28;
/** Ignore tilt below this (g) so a roughly-level phone doesn't drift. */
export const TILT_DEADZONE = 0.035;

/** Progress is quantized to this step before reaching React state, so the
    progress bar re-renders ~100 times per race instead of every frame. */
export const PROGRESS_STEP = 0.01;

/** Same-lane collision window (world units) around the player anchor. */
export const COLLISION_WINDOW = 40;

/** Mario-Kart-style rubber banding: rivals slow when far ahead of the
    player and catch up when far behind, so every kid stays in the race. */
export const RUBBER_BAND = {
  /** Distance gap (units) where banding reaches full strength. */
  window: 260,
  /** Speed factor for a rival far AHEAD of the player. */
  slow: 0.85,
  /** Speed factor for a rival far BEHIND the player. */
  catchUp: 1.18,
};

/** Gentle pacing per age band (multiplies the level base speed). */
export const AGE_SPEED_FACTOR: Record<string, number> = {
  toddler: 0.8,
  preschool: 0.85,
  early: 1,
  kids: 1.1,
};

/* ---------------- road rendering ---------------- */

/** Lane-separator dash pattern, in world units. */
export const DASH_LEN = 60;
export const DASH_GAP = 50;

/** Roadside decoration band spacing, in world units. */
export const DECOR_SPACING = 220;
/** Bands per repeating roadside strip — lcm of the emoji (≤4) / side (2) /
    size (3) cycles, so the pattern is seamless when the phase wraps. */
export const DECOR_BANDS = 12;

/** Road width as a ratio of the playfield width. */
export const ROAD_WIDTH_RATIO = 0.7;

/* ---------------- garage catalog ---------------- */

/** Car personality: `speed` multiplies base speed, `grip` multiplies the
    steering spring (snappier lane changes). Faster cars trade away grip. */
export const CARS: readonly CarDef[] = [
  { id: 'turbo', emoji: '🏎️', price: 0, stats: { speed: 1.0, grip: 1.0 } },
  { id: 'zippy', emoji: '🚗', price: 80, stats: { speed: 1.02, grip: 0.98 } },
  { id: 'buggy', emoji: '🚙', price: 150, stats: { speed: 0.98, grip: 1.08 } },
  { id: 'taxi', emoji: '🚕', price: 250, stats: { speed: 1.04, grip: 0.95 } },
  { id: 'patrol', emoji: '🚓', price: 400, stats: { speed: 1.06, grip: 0.97 } },
  { id: 'truck', emoji: '🛻', price: 600, stats: { speed: 0.95, grip: 1.12 } },
  { id: 'tractor', emoji: '🚜', price: 900, stats: { speed: 0.92, grip: 1.15 } },
  { id: 'moto', emoji: '🏍️', price: 1500, stats: { speed: 1.1, grip: 0.9 } },
];

/** Stat-bar rendering range in the garage (maps stat → 0..1 fill). */
export const STAT_RANGE = { min: 0.85, max: 1.18 };

export const TRIMS: readonly TrimDef[] = [
  { id: 'coral', ...ACCENTS.coral },
  { id: 'green', ...ACCENTS.green },
  { id: 'blue', ...ACCENTS.blue },
  { id: 'orange', ...ACCENTS.orange },
];

export const DEFAULT_GARAGE = {
  coins: 0,
  owned: ['turbo' as const],
  selected: 'turbo' as const,
  trim: 'coral' as const,
};

export const DEFAULT_PREFS = {
  control: 'drag' as const,
};

/* ---------------- track themes (Sunny Adventure) ---------------- */

/** Warm asphalt — game-art color shared by all themes. */
const ASPHALT = '#55483A';

export const THEMES: Record<ThemeId, RoadTheme> = {
  meadow: {
    id: 'meadow',
    chipEmoji: '🌼',
    sky: ACCENTS.blue.tint,
    ground: ACCENTS.green.tint,
    groundPatch: ACCENTS.green.base,
    road: ASPHALT,
    dash: '#FFFAF1',
    decorations: ['🌼', '🌳', '🌷', '🐞'],
  },
  beach: {
    id: 'beach',
    chipEmoji: '🏖️',
    sky: ACCENTS.blue.tint,
    ground: ACCENTS.orange.tint,
    groundPatch: ACCENTS.orange.base,
    road: ASPHALT,
    dash: '#FFFAF1',
    decorations: ['🌴', '🐚', '⛱️', '🦀'],
  },
  desert: {
    id: 'desert',
    chipEmoji: '🌵',
    sky: '#FBF0D8',
    ground: '#F8E8C8',
    groundPatch: '#F6C747',
    road: ASPHALT,
    dash: '#FFFAF1',
    decorations: ['🌵', '🪨', '🦎'],
  },
  snow: {
    id: 'snow',
    chipEmoji: '⛄',
    sky: ACCENTS.blue.tint,
    ground: '#FFFFFF',
    groundPatch: ACCENTS.blue.tint,
    road: ASPHALT,
    dash: '#FFFAF1',
    decorations: ['⛄', '🌲', '❄️'],
  },
};

/** Theme rotation: level 1 = meadow, 2 = beach, 3 = desert, 4 = snow, … */
export const THEME_ORDER: readonly ThemeId[] = [
  'meadow',
  'beach',
  'desert',
  'snow',
];

/* ---------------- entity emoji ---------------- */

export const ENTITY_EMOJI: Record<string, string> = {
  coin: '🪙',
  cone: '🚧',
  barrel: '🛢️',
  boost: '⚡',
  shield: '🛡️',
  magnet: '🧲',
};

export const RIVAL_EMOJI = ['🚙', '🚕'] as const;
export const TRAFFIC_EMOJI = '🚚';

/* ---------------- missions (rolling, coin-rewarded) ---------------- */

/** Per-type target ladders; when a ladder is exhausted the last target keeps
    growing ×1.5 (rounded to 5). Rewards scale with the target. */
export const MISSION_LADDERS: Record<
  string,
  { targets: readonly number[]; rewardPerTarget: number; emoji: string }
> = {
  coins: { targets: [20, 50, 100, 200], rewardPerTarget: 1, emoji: '🪙' },
  first: { targets: [1, 3, 6, 10], rewardPerTarget: 25, emoji: '🥇' },
  races: { targets: [3, 8, 15, 25], rewardPerTarget: 8, emoji: '🏁' },
  boost: { targets: [3, 8, 15], rewardPerTarget: 10, emoji: '⚡' },
  clean: { targets: [1, 3, 6], rewardPerTarget: 30, emoji: '🌟' },
};

/** The three mission slots cycle through these types. */
export const MISSION_TYPES = ['coins', 'first', 'races', 'boost', 'clean'] as const;
