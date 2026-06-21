import { createStore, type Store } from '@/sdk/storage/createStore';

/**
 * Guided-journey checkpoint. Scoreless by design — we persist only how far
 * through the interleaved sequence the child has reached (`step`) plus the
 * session `seed` so resumed content is identical to what they left.
 */
export type FlowProgress = { step: number; seed: number; updatedAt: number };

/** seed 0 + updatedAt 0 is the "never started" sentinel. */
export const DEFAULT_FLOW_PROGRESS: FlowProgress = { step: 0, seed: 0, updatedAt: 0 };

/** Single guided-journey checkpoint. Key becomes kg:flow:progress. */
export function createFlowProgressStore(): Store<FlowProgress> {
  return createStore<FlowProgress>('flow:progress', DEFAULT_FLOW_PROGRESS);
}

/** Position within a journey of `total` units. */
export type FlowPosition = { done: false; step: number } | { done: true };

/** A fresh, non-zero session seed for deterministic-but-varied content. */
export function newSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff) + 1;
}

/**
 * Decide where to resume. Empty journey → done. Saved step is clamped into
 * range; a step at/after the end means the journey was finished (rest state).
 */
export function resolveStart(total: number, saved: FlowProgress): FlowPosition {
  if (total <= 0) return { done: true };
  if (saved.step >= total) return { done: true };
  const step = saved.step > 0 ? saved.step : 0;
  return { done: false, step };
}

/** Advance one unit; past the last unit → done. */
export function advanceStep(total: number, step: number): FlowPosition {
  if (step + 1 >= total) return { done: true };
  return { done: false, step: step + 1 };
}
