/* Race loop hook — owns the mutable WorldState in a ref and splits output
   into two paths so motion stays smooth on real devices:

   FAST (every rAF frame): a handful of Animated.Value.setValue() calls
   (world scroll, dash/decor phase, player laneX/bank/shake, rival channels).
   The Playfield maps them to transforms on stable views — no re-rendering.

   SLOW (sparse): a small RaceUiState published through setState ONLY when
   something the UI shows actually changed (countdown beat, coins, place,
   quantized progress, boost/slow flags, consumed entities). */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useSettings, useSound } from '@/sdk';
import {
  AGE_SPEED_FACTOR,
  BANK_MAX_DEG,
  BANK_PER_LANE_VEL,
  DASH_GAP,
  DASH_LEN,
  DECOR_BANDS,
  DECOR_SPACING,
  PROGRESS_STEP,
  SHAKE_FREQ,
} from '../constants';
import {
  createWorld,
  pauseWorld,
  resumeWorld,
  steerTo,
  stepWorld,
  toSnapshot,
} from '../utils/engine';
import type {
  CarDef,
  GameEvent,
  LevelData,
  RaceAnimRefs,
  RaceStats,
  RaceUiState,
  WorldState,
} from '../types';

/** Clamp dt so a backgrounded/paused frame can't teleport the car. */
const MAX_DT_MS = 50;

const DASH_PERIOD = DASH_LEN + DASH_GAP;
const DECOR_PERIOD = DECOR_BANDS * DECOR_SPACING;

const EVENT_SOUND: Record<GameEvent, string> = {
  go: 'transition',
  coin: 'success',
  hit: 'hit',
  boost: 'powerup',
  shield: 'powerup',
  magnet: 'powerup',
  shieldBlock: 'pop', // absorbed — a thump, not a crash
  finish: 'win',
};

export type RaceResult = { place: 1 | 2 | 3; stars: number } & RaceStats;

type Args = {
  level: LevelData;
  car: CarDef;
  onFinish: (result: RaceResult) => void;
};

function uiFrom(world: WorldState, level: LevelData, consumed: number[]): RaceUiState {
  // toSnapshot carries the countdown-label logic; reuse it for the UI state.
  const snap = toSnapshot(world, level);
  return {
    phase: world.phase,
    countdown: snap.countdown,
    place: world.place,
    coins: world.coins,
    progress: Math.min(1, Math.floor(snap.progress / PROGRESS_STEP) * PROGRESS_STEP),
    boostActive: snap.boostActive,
    slowActive: snap.slowActive,
    shieldActive: world.shield > 0,
    magnetActive: world.phase === 'racing' && world.elapsed < world.magnetUntil,
    consumedIds: consumed,
  };
}

const uiChanged = (a: RaceUiState, b: RaceUiState): boolean =>
  a.phase !== b.phase ||
  a.countdown !== b.countdown ||
  a.place !== b.place ||
  a.coins !== b.coins ||
  a.progress !== b.progress ||
  a.boostActive !== b.boostActive ||
  a.slowActive !== b.slowActive ||
  a.shieldActive !== b.shieldActive ||
  a.magnetActive !== b.magnetActive ||
  a.consumedIds !== b.consumedIds;

export function useRaceGame({ level, car, onFinish }: Args): {
  ui: RaceUiState;
  anim: RaceAnimRefs;
  steerTo: (lane: number) => void;
  pause: () => void;
  resume: () => void;
} {
  const { play } = useSound();
  const { settings } = useSettings();

  // Gentle pacing per age band (scales player AND rivals via baseSpeed),
  // then the car's speed stat on top.
  const factor =
    (settings.ageBand ? AGE_SPEED_FACTOR[settings.ageBand] : undefined) ?? 1;
  const paced = useMemo<LevelData>(
    () => ({ ...level, baseSpeed: level.baseSpeed * factor * car.stats.speed }),
    [level, factor, car],
  );

  // Fast-path channels — created once, written every frame, never re-created
  // (the Playfield holds interpolations onto these exact instances).
  const anim = useMemo<RaceAnimRefs>(
    () => ({
      dist: new Animated.Value(0),
      dashPhase: new Animated.Value(0),
      decorPhase: new Animated.Value(0),
      playerLaneX: new Animated.Value(1),
      bank: new Animated.Value(0),
      shake: new Animated.Value(0),
      rivals: level.rivals.map((r) => ({
        laneX: new Animated.Value(r.startLane),
        gap: new Animated.Value(0),
      })),
      traffic: level.traffic.map((t) => ({
        lane: new Animated.Value(t.startLane),
        gap: new Animated.Value(t.gapAhead),
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const world = useRef<WorldState>(createWorld(paced));
  const consumed = useRef<number[]>([]);
  const [ui, setUi] = useState<RaceUiState>(() => uiFrom(world.current, paced, consumed.current));
  const lastUi = useRef(ui);

  // Latest dynamic values, read by the stable loop/steer closures.
  const ref = useRef({ paced, onFinish, play });
  ref.current = { paced, onFinish, play };

  const lastIntent = useRef(1);

  // Fresh level prop → fresh world + fresh loop. (Age-factor changes mid-race
  // intentionally do NOT restart the race — they just adjust pacing.)
  useEffect(() => {
    const lvl0 = ref.current.paced;
    world.current = createWorld(lvl0);
    consumed.current = [];
    lastIntent.current = 1;
    const first = uiFrom(world.current, lvl0, consumed.current);
    lastUi.current = first;
    setUi(first);

    let raf = 0;
    let last: number | undefined;

    const frame = (now: number) => {
      const w = world.current;
      const { paced: lvl, onFinish: finish, play: sound } = ref.current;
      const dtMs = last === undefined ? 16 : Math.min(now - last, MAX_DT_MS);
      last = now;

      const events = stepWorld(w, lvl, dtMs);
      let consumedChanged = false;
      for (const event of events) {
        sound(EVENT_SOUND[event]);
        if (event === 'coin' || event === 'hit' || event === 'boost') {
          consumedChanged = true;
        }
        if (event === 'finish') {
          finish({
            place: w.place,
            stars: 4 - w.place, // 1st → 3 ★, 2nd → 2 ★, 3rd → 1 ★
            coins: w.coins,
            hits: w.hits,
            boosts: w.boosts,
          });
        }
      }
      if (consumedChanged) {
        // Entity ids still alive → consumed = level ids minus world ids.
        const alive = new Set(w.entities.map((e) => e.id));
        consumed.current = lvl.entities
          .filter((e) => !alive.has(e.id))
          .map((e) => e.id);
      }

      /* ---- fast path: pure transform channels, no re-render ---- */
      anim.dist.setValue(w.dist);
      anim.dashPhase.setValue(w.dist % DASH_PERIOD);
      anim.decorPhase.setValue(w.dist % DECOR_PERIOD);
      anim.playerLaneX.setValue(w.playerLaneX);
      anim.bank.setValue(
        Math.max(
          -BANK_MAX_DEG,
          Math.min(BANK_MAX_DEG, w.laneVel * BANK_PER_LANE_VEL),
        ),
      );
      anim.shake.setValue(
        w.shake > 0.01 ? Math.sin((w.elapsed / 1000) * SHAKE_FREQ) * w.shake * 0.16 : 0,
      );
      for (let i = 0; i < anim.rivals.length; i++) {
        const r = w.rivals[i];
        if (!r) continue;
        anim.rivals[i].laneX.setValue(r.laneX);
        anim.rivals[i].gap.setValue(r.dist - w.dist);
      }
      for (let i = 0; i < anim.traffic.length; i++) {
        const truck = w.traffic[i];
        if (!truck) continue;
        anim.traffic[i].lane.setValue(truck.lane);
        anim.traffic[i].gap.setValue(truck.dist - w.dist);
      }

      /* ---- slow path: only when something visible changed ---- */
      const next = uiFrom(w, lvl, consumed.current);
      if (uiChanged(lastUi.current, next)) {
        lastUi.current = next;
        setUi(next);
      }

      if (w.phase !== 'finished') raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // Continuous steering (finger-follow drag / tilt). A soft pop plays only
  // when the steering target commits to a NEW lane — not on every move event.
  const handleSteerTo = useCallback((lane: number) => {
    const w = world.current;
    if (w.phase === 'finished') return;
    steerTo(w, lane);
    const intent = Math.round(w.targetLaneX);
    if (intent !== lastIntent.current) {
      lastIntent.current = intent;
      ref.current.play('pop', { haptic: false });
    }
  }, []);

  // Pause/resume — the loop keeps ticking but stepWorld no-ops while paused,
  // and the next ui change flips phase for the overlay. Resume replays one
  // countdown beat so the child has a moment to get ready.
  const pause = useCallback(() => {
    pauseWorld(world.current);
  }, []);
  const resume = useCallback(() => {
    resumeWorld(world.current);
    ref.current.play('pop', { haptic: false });
  }, []);

  return { ui, anim, steerTo: handleSteerTo, pause, resume };
}
