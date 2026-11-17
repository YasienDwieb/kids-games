/**
 * Whether this device should draw the 3D (expo-gl) boards, and a guard around
 * starting each GL context.
 *
 * expo-gl creates every context on its own native thread and throws there when
 * the driver refuses a config (`IllegalArgumentException: eglChooseConfig
 * failed`). JS can't catch that: the app just dies. So:
 *
 * - Weak Android devices (little RAM) get the 2D boards from the start, and
 *   "heavy" scenes (several canvases at once) need a roomier device.
 * - Contexts start one at a time, a moment after the last one closed, so a
 *   new context never races another's setup or teardown.
 * - Before a context starts, a `pending` marker is written; it's cleared once
 *   the canvas reports it was created. If the app launches with the marker
 *   still set, the last launch died starting GL, and 3D stays off for this
 *   build (a new store build tries again).
 */
import { createContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { createStore } from '../storage/createStore';
import { track } from '../analytics/client';

/** `off`: 2D only. `lite`: one canvas at a time. `full`: heavy scenes too. */
export type Gl3DSupport = 'off' | 'lite' | 'full';

// Android reports `totalMem` (what the kernel can use), which is always below
// the RAM on the box: a "6 GB" phone reports ~5.5 GiB, a "3 GB" one ~2.7 GiB.
// The thresholds sit between those classes, not on the marketed numbers.
const GB = 1024 * 1024 * 1024;
/** Below this (2 GB-class devices), Android gets no 3D at all. */
export const MIN_3D_MEMORY = 2.5 * GB;
/** Scenes with several canvases on screen (Animal Safari's tiles) need a 6 GB-class device. */
export const HEAVY_3D_MEMORY = 5 * GB;

export function supportFor(opts: {
  os: string;
  totalMemory: number | null;
  crashedHere: boolean;
}): Gl3DSupport {
  if (opts.crashedHere) return 'off';
  if (opts.os !== 'android') return 'full';
  const mem = opts.totalMemory;
  if (mem == null) return 'lite';
  if (mem < MIN_3D_MEMORY) return 'off';
  return mem < HEAVY_3D_MEMORY ? 'lite' : 'full';
}

type GlState = { pending: boolean; disabledBuild: string | null };
const glStore = createStore<GlState>('gl3d', { pending: false, disabledBuild: null });

const BUILD = Application.nativeBuildVersion ?? 'dev';
let support: Gl3DSupport | null = null;
let disabledBuild: string | null = null;
let booting: Promise<Gl3DSupport> | null = null;

/** Reads (once) whether the last launch died starting GL, and settles `support`. */
export function bootGl3D(): Promise<Gl3DSupport> {
  booting ??= glStore
    .get()
    .catch((): GlState => ({ pending: false, disabledBuild: null }))
    .then(async (s) => {
      disabledBuild = s.disabledBuild;
      if (s.pending) {
        disabledBuild = BUILD;
        track('gl3d_disabled', {});
        await glStore.set({ pending: false, disabledBuild }).catch(() => undefined);
      }
      support = supportFor({
        os: Platform.OS,
        totalMemory: Device.totalMemory,
        crashedHere: disabledBuild === BUILD,
      });
      return support;
    });
  return booting;
}

/** The device's 3D support; null until the boot check has run. */
export function useGl3D(): Gl3DSupport | null {
  const [value, setValue] = useState(support);
  useEffect(() => {
    if (value != null) return;
    let alive = true;
    void bootGl3D().then((s) => {
      if (alive) setValue(s);
    });
    return () => {
      alive = false;
    };
  }, [value]);
  return value;
}

/** Gap kept after a context closes before the next one starts. */
const TEARDOWN_GAP_MS = 300;
/** A context that never reports created stops blocking the queue after this. */
const SLOT_TIMEOUT_MS = 5000;

let queue: Promise<void> = Promise.resolve();
let starting = 0;
let lastClosedAt = 0;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const writePending = (pending: boolean) =>
  glStore.set({ pending, disabledBuild }).catch(() => undefined);

export type GlSlot = {
  /** The canvas exists: clear the marker and let the next context start. */
  created: () => void;
  /** The canvas went away (created or not). */
  closed: () => void;
};

/** The slot of the enclosing `Stage3D`, read by `Canvas3D`. */
export const GlSlotContext = createContext<GlSlot | null>(null);

/**
 * Waits for this context's turn, writes the crash marker, and resolves with
 * the slot to report back on. Mount the canvas only after it resolves.
 */
export function acquireGlSlot(): Promise<GlSlot> {
  let free!: () => void;
  const turnDone = new Promise<void>((r) => (free = r));
  const turn = queue.then(async () => {
    const gap = lastClosedAt + TEARDOWN_GAP_MS - Date.now();
    if (gap > 0) await wait(gap);
    starting += 1;
    if (starting === 1) await writePending(true);
  });
  queue = turn.then(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<void>((r) => (timer = setTimeout(r, SLOT_TIMEOUT_MS)));
    return Promise.race([turnDone, timeout]).finally(() => clearTimeout(timer));
  });

  return turn.then(() => {
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      starting -= 1;
      if (starting === 0) void writePending(false);
      free();
    };
    return {
      created: settle,
      closed: () => {
        settle();
        lastClosedAt = Date.now();
      },
    };
  });
}

/** Test helper. */
export function resetGl3D(): void {
  support = null;
  disabledBuild = null;
  booting = null;
  queue = Promise.resolve();
  starting = 0;
  lastClosedAt = 0;
}
