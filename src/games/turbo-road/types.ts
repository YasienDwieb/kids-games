/* Shared contracts for the Turbo Road game. The engine (utils/), the hooks
   and the presentational components all build against these types — keep
   them in sync with utils/engine.ts and the component implementations. */

// Type-only import — erased at compile time, so the pure engine/tests never
// actually load react-native through this module.
import type { Animated } from 'react-native';

export type LaneIndex = 0 | 1 | 2;

export type ThemeId = 'meadow' | 'beach' | 'desert' | 'snow';

export type EntityKind = 'coin' | 'cone' | 'barrel' | 'boost' | 'shield' | 'magnet';

export interface RoadEntity {
  id: number;
  kind: EntityKind;
  lane: LaneIndex;
  /** World distance (units) at which this entity sits on the road. */
  dist: number;
}

export interface RivalProfile {
  id: string;
  emoji: string;
  startLane: LaneIndex;
  /** Multiplier on the level base speed before rubber-banding (≈0.9–0.98). */
  baseFactor: number;
  /** Switch lanes roughly every N world units. */
  laneChangeEvery: number;
}

export interface RivalState {
  id: string;
  emoji: string;
  lane: LaneIndex;
  /** Rendered lane position — eases toward `lane` so rivals never teleport. */
  laneX: number;
  /** Persistent offset into the bounce sequence, bumped by the anti-stacking
      separation so the new lane survives the per-frame recompute. */
  laneShift: number;
  dist: number;
}

/** Oncoming truck spawn: starts `gapAhead` units ahead of the player and
    drives TOWARD them; recycles ahead after being passed. */
export interface TrafficProfile {
  id: string;
  startLane: LaneIndex;
  gapAhead: number;
  /** Their own speed as a fraction of level base speed. */
  speedFactor: number;
}

export interface TrafficState {
  id: string;
  lane: LaneIndex;
  dist: number;
  respawns: number;
}

export interface LevelData {
  level: number;
  theme: ThemeId;
  raceLength: number;
  baseSpeed: number;
  entities: RoadEntity[];
  rivals: RivalProfile[];
  traffic: TrafficProfile[];
}

export type RacePhase = 'countdown' | 'racing' | 'paused' | 'finished';

export type GameEvent =
  | 'go'
  | 'coin'
  | 'hit'
  | 'boost'
  | 'shield'
  | 'magnet'
  | 'shieldBlock'
  | 'finish';

export interface WorldState {
  phase: RacePhase;
  /** ms since createWorld, advanced by stepWorld. */
  elapsed: number;
  playerLane: LaneIndex;
  /** Interpolated lane position (0..2) for smooth lane-switch rendering. */
  playerLaneX: number;
  /** Continuous steering target (0..2) — playerLaneX spring-follows it. Fed
      by finger-follow drag or tilt; requestLane() snaps it one lane at a time. */
  targetLaneX: number;
  /** Lateral velocity (lanes/sec) of the steering spring — drives banking. */
  laneVel: number;
  /** Post-hit camera shake amplitude, 1 → 0 with SHAKE_TAU decay. */
  shake: number;
  /** Steering-grip multiplier from the selected car (scales the spring). */
  grip: number;
  dist: number;
  speed: number;
  /** elapsed-ms timestamps until which the boost / slowdown applies. */
  boostUntil: number;
  slowUntil: number;
  /** Countdown ends (racing starts) at this elapsed-ms; GO! flashes until
      goFlashUntil. Reset by resumeWorld for the resume beat. */
  countdownUntil: number;
  goFlashUntil: number;
  /** Obstacles can't hit while elapsed < graceUntil (post-hit forgiveness). */
  graceUntil: number;
  /** Shared 0→1 off-the-line ramp (player and rivals launch together). */
  launch: number;
  /** Held shield charges (0/1) and the magnet expiry. */
  shield: number;
  magnetUntil: number;
  coins: number;
  /** Race stats for missions. */
  hits: number;
  boosts: number;
  rivals: RivalState[];
  traffic: TrafficState[];
  /** Entities not yet consumed. */
  entities: RoadEntity[];
  place: 1 | 2 | 3;
}

/* ---------- view-model handed to the presentational layer ---------- */

export interface VisibleEntity {
  id: number;
  kind: EntityKind;
  lane: LaneIndex;
  /** 0 = horizon (top of playfield) … 1 = bottom edge. */
  yRatio: number;
}

export interface VisibleRival {
  id: string;
  emoji: string;
  lane: LaneIndex;
  /** Eased lane position used for rendering. */
  laneX: number;
  yRatio: number;
}

export interface RaceSnapshot {
  phase: RacePhase;
  /** '3' | '2' | '1' | 'go' while counting down, undefined afterwards. */
  countdown?: string;
  playerLane: LaneIndex;
  playerLaneX: number;
  /** 0..1 — race completion; drives the progress bar + finish strip. */
  progress: number;
  /** World dist; drives the lane-dash / decoration scroll offset. */
  dist: number;
  place: 1 | 2 | 3;
  coins: number;
  boostActive: boolean;
  slowActive: boolean;
  entities: VisibleEntity[];
  rivals: VisibleRival[];
}

/* ---------- garage ---------- */

export type CarId =
  | 'turbo'
  | 'zippy'
  | 'buggy'
  | 'taxi'
  | 'patrol'
  | 'truck'
  | 'tractor'
  | 'moto';

export type TrimId = 'coral' | 'green' | 'blue' | 'orange';

export interface CarDef {
  id: CarId;
  emoji: string;
  /** Coin price; 0 = owned from the start. */
  price: number;
  /** Personality: speed multiplies base speed, grip multiplies steering. */
  stats: { speed: number; grip: number };
}

export interface TrimDef {
  id: TrimId;
  base: string;
  deep: string;
  tint: string;
}

export interface GarageState {
  coins: number;
  owned: CarId[];
  selected: CarId;
  trim: TrimId;
}

/* ---------- missions ---------- */

export type MissionType = 'coins' | 'first' | 'races' | 'boost' | 'clean';

export interface Mission {
  id: number;
  type: MissionType;
  /** Index into the type's target ladder (keeps growth deterministic). */
  tier: number;
  target: number;
  progress: number;
  reward: number;
}

export interface MissionsState {
  active: Mission[];
  nextId: number;
}

/** Per-race stats fed into mission progress. */
export interface RaceStats {
  coins: number;
  place: 1 | 2 | 3;
  hits: number;
  boosts: number;
}

/* ---------- control preferences ---------- */

/** 'drag' = finger-follow steering (default); 'tilt' = motion steering. */
export type ControlMode = 'drag' | 'tilt';

export interface PrefsState {
  control: ControlMode;
}

export interface RoadTheme {
  id: ThemeId;
  chipEmoji: string;
  sky: string;
  ground: string;
  groundPatch: string;
  road: string;
  dash: string;
  decorations: readonly string[];
}

/* ---------- fast path (60 fps) / slow path (events) split ---------- */

/** Per-frame motion channels, written with `setValue` from the race loop and
    mapped to pixel transforms inside the Playfield. No React re-renders. */
export interface RaceAnimRefs {
  /** World distance (world units) — scrolls the world/entity layer. */
  dist: Animated.Value;
  /** dist % DASH_PERIOD (world units) — scrolls the repeating dash strip. */
  dashPhase: Animated.Value;
  /** dist % decor period (world units) — scrolls the roadside strip. */
  decorPhase: Animated.Value;
  /** Player lane position 0..2 (spring-followed). */
  playerLaneX: Animated.Value;
  /** Car banking in degrees (negative = leaning left). */
  bank: Animated.Value;
  /** Post-hit shake offset in lane units (already oscillating + decayed). */
  shake: Animated.Value;
  /** One per rival: eased lane position and dist gap to the player. */
  rivals: { laneX: Animated.Value; gap: Animated.Value }[];
  /** One per oncoming truck: lane (snaps on respawn) and dist gap. */
  traffic: { lane: Animated.Value; gap: Animated.Value }[];
}

/** Slow-path UI state — changes only on real events (coin, place change,
    countdown beat, quantized progress), keeping React re-renders sparse. */
export interface RaceUiState {
  phase: RacePhase;
  countdown?: string;
  place: 1 | 2 | 3;
  coins: number;
  /** Quantized to PROGRESS_STEP. */
  progress: number;
  boostActive: boolean;
  slowActive: boolean;
  /** Held shield charge + magnet window (HUD chips, car effects). */
  shieldActive: boolean;
  magnetActive: boolean;
  /** Consumed (collected / crashed) entity ids — the Playfield hides these. */
  consumedIds: readonly number[];
}

/* ---------- component prop contracts (presentational layer) ---------- */

export interface PlayfieldProps {
  theme: RoadTheme;
  /** The full level: entities render ONCE into the world layer (fixed world
      positions); only the layer's transform moves per frame. */
  level: LevelData;
  ui: RaceUiState;
  anim: RaceAnimRefs;
  playerEmoji: string;
  trim: TrimDef;
  /** Continuous steering: target lane position 0..2 (the car follows it). */
  onSteerTo: (lane: number) => void;
}

export interface HudProps {
  level: number;
  place: 1 | 2 | 3;
  coins: number;
  shieldActive: boolean;
  magnetActive: boolean;
  onPause: () => void;
}

export interface ProgressBarProps {
  /** 0..1 */
  progress: number;
}

export interface StartScreenProps {
  level: number;
  totalStars: number;
  theme: RoadTheme;
  playerEmoji: string;
  trim: TrimDef;
  walletCoins: number;
  control: ControlMode;
  missions: Mission[];
  onClaimMission: (id: number) => void;
  onControlChange: (mode: ControlMode) => void;
  onRace: () => void;
  onGarage: () => void;
}

export interface WinOverlayProps {
  place: 1 | 2 | 3;
  stars: number;
  coinsEarned: number;
  /** Set when this race completed a 4-level tour — shows the cup banner. */
  cupTheme?: ThemeId;
  onNext: () => void;
  onGarage: () => void;
}

export interface PauseOverlayProps {
  onResume: () => void;
  onExit: () => void;
}

export interface GarageScreenProps {
  garage: GarageState;
  /** Number of cups earned (one per completed 4-level tour). */
  trophies: number;
  onSelectCar: (id: CarId) => void;
  onUnlockCar: (id: CarId) => void;
  onSelectTrim: (id: TrimId) => void;
  onDone: () => void;
}
