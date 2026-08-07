/* Worklet-safe motion math.
 *
 * Every function here carries the `'worklet'` directive so it can be called
 * from a UI-thread frame callback as well as from ordinary JS. Keep them pure
 * and dependency-free — a worklet cannot reach into module state or closures
 * that were not captured at build time. */

/** Longest frame a game will integrate, in seconds (~30fps). */
export const MAX_DT = 1 / 30;

/**
 * Convert reanimated's `timeSincePreviousFrame` (ms, `null` on the first frame)
 * into a clamped delta in seconds.
 *
 * Clamping matters: without it a single stalled frame — GC, audio decode, or
 * the app returning from the background — integrates one enormous step and
 * every moving object jumps across the screen instead of travelling there.
 */
export function clampDt(msSincePreviousFrame: number | null, maxDt = MAX_DT): number {
  'worklet';
  if (msSincePreviousFrame == null) return 0;
  const seconds = msSincePreviousFrame / 1000;
  if (!(seconds > 0)) return 0; // negative or NaN → treat as a still frame
  return seconds < maxDt ? seconds : maxDt;
}

export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return value < min ? min : value > max ? max : value;
}

export function lerp(from: number, to: number, t: number): number {
  'worklet';
  return from + (to - from) * t;
}

/**
 * Ease `current` toward `target` at `rate` (higher = snappier), independent of
 * frame rate.
 *
 * The naive form — `v += (target - v) * k` — converges faster on a 120Hz device
 * than a 60Hz one, so the same chase feels different per phone. The exponential
 * form below depends on elapsed *time*, so the feel is identical everywhere.
 */
export function approach(current: number, target: number, rate: number, dt: number): number {
  'worklet';
  if (dt <= 0) return current;
  return target + (current - target) * Math.exp(-rate * dt);
}

/** Wrap `value` into the `[0, span)` range — for looping scroll/parallax phases. */
export function wrap(value: number, span: number): number {
  'worklet';
  if (span <= 0) return 0;
  const m = value % span;
  return m < 0 ? m + span : m;
}
