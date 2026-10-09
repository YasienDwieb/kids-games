import { createStore, type Store } from '@/sdk/storage/createStore';
import type { FlowAdapter } from './adapter';
import { buildSequence, type SeqStep } from './sequence';

/**
 * Guided-journey checkpoint. Scoreless by design — we persist how far the
 * child has got plus the session `seed` so resumed content is identical to
 * what they left.
 *
 * `done` (units finished per game) is the source of truth: it survives the
 * journey's game list changing — a game added in an update, or a parent
 * toggling games in Settings — because each game's units are always played in
 * order. `step` (an index into one particular sequence) is kept for older
 * saves and for writers that only know "start over" (step 0, no `done`).
 */
export type FlowProgress = {
  step: number;
  seed: number;
  updatedAt: number;
  done?: Record<string, number>;
};

/** seed 0 + updatedAt 0 is the "never started" sentinel. */
export const DEFAULT_FLOW_PROGRESS: FlowProgress = { step: 0, seed: 0, updatedAt: 0 };

/** Single guided-journey checkpoint. Key becomes kg:flow:progress. */
export function createFlowProgressStore(): Store<FlowProgress> {
  return createStore<FlowProgress>('flow:progress', DEFAULT_FLOW_PROGRESS);
}

/**
 * The journey as it was before per-game `done` maps were saved. A step-only
 * save indexes THIS sequence, not the current one: later releases appended
 * games and letter-land grew to 28 units in Arabic. Never edit — it describes
 * data already on devices.
 */
export const LEGACY_JOURNEY: readonly { gameId: string; count?: number }[] = [
  { gameId: 'count-and-pop' },
  { gameId: 'shape-detective' },
  { gameId: 'match-up' },
  { gameId: 'letter-land', count: 26 },
  { gameId: 'numbers-land' },
  { gameId: 'animal-safari' },
];

/** The legacy sequence for the given (selected) adapters — what a step-only save indexes. */
export function legacySequence(adapters: readonly FlowAdapter[]): SeqStep[] {
  const byId = new Map(adapters.map((a) => [a.gameId, a]));
  return buildSequence(
    LEGACY_JOURNEY.flatMap(({ gameId, count }) => {
      const a = byId.get(gameId);
      return a ? [{ ...a, count: count ?? a.count }] : [];
    }),
  );
}

/**
 * Units finished per game. A step-only save (older app, or a "start over"
 * write) credits the first `step` units of `stepSequence` — pass
 * `legacySequence(adapters)` for real saves.
 */
export function doneCounts(stepSequence: readonly SeqStep[], saved: FlowProgress): Record<string, number> {
  if (saved.done) return saved.done;
  const done: Record<string, number> = {};
  for (const s of stepSequence.slice(0, Math.max(0, saved.step))) {
    done[s.gameId] = Math.max(done[s.gameId] ?? 0, s.localIndex + 1);
  }
  return done;
}

/** First step of `sequence` whose unit isn't finished yet (= sequence.length when all are). */
export function firstOpenStep(sequence: readonly SeqStep[], done: Record<string, number>): number {
  const i = sequence.findIndex((s) => s.localIndex >= (done[s.gameId] ?? 0));
  return i < 0 ? sequence.length : i;
}

/** Where a saved journey resumes in the current sequence. */
export function resumeStep(sequence: readonly SeqStep[], saved: FlowProgress): number {
  return firstOpenStep(sequence, doneCounts(sequence, saved));
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
