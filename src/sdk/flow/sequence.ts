import type { FlowAdapter } from './adapter';

/** One resolved position in the interleaved journey. */
export type SeqStep = { gameId: string; localIndex: number };

/** The gameId journey moments use in the sequence and in saved progress. */
export const MOMENTS_ID = 'moments';

/**
 * Puts a moment after every `every`-th game step, at most `min(max, momentCount)`
 * times, never after the final step. Moments are `{ gameId: MOMENTS_ID, localIndex: 0, 1, … }`.
 * Pure; with max 0 or no moments it returns `seq` unchanged.
 */
export function insertMoments(
  seq: SeqStep[],
  opts: { every: number; max: number; momentCount: number },
): SeqStep[] {
  const limit = Math.min(opts.max, opts.momentCount);
  if (limit <= 0 || opts.every < 1) return seq;
  const out: SeqStep[] = [];
  let added = 0;
  seq.forEach((step, i) => {
    out.push(step);
    const gameSteps = i + 1;
    if (added < limit && gameSteps % opts.every === 0 && gameSteps < seq.length) {
      out.push({ gameId: MOMENTS_ID, localIndex: added });
      added += 1;
    }
  });
  return out;
}

/**
 * The whole journey: the games interleaved, with moments slotted in when
 * `moments` is given. Home's progress card and the player both use this.
 */
export function journeySequence(
  adapters: FlowAdapter[],
  moments?: { adapter: FlowAdapter; every: number; max: number } | null,
): SeqStep[] {
  const games = buildSequence(adapters);
  if (!moments) return games;
  return insertMoments(games, { every: moments.every, max: moments.max, momentCount: moments.adapter.count });
}

/** Total units across all given adapters. */
export function sequenceLength(adapters: FlowAdapter[]): number {
  return adapters.reduce((sum, a) => sum + a.count, 0);
}

/**
 * Round-robin interleave across games: game0#0, game1#0, game0#1, game1#1, …
 * Each game contributes exactly `count` units; a game that runs out is skipped
 * while others continue. This is the "mash content across games" ordering.
 */
export function buildSequence(adapters: FlowAdapter[]): SeqStep[] {
  if (adapters.length === 0) return [];
  const out: SeqStep[] = [];
  const local = adapters.map(() => 0);
  let remaining = sequenceLength(adapters);
  let gi = 0;
  while (remaining > 0) {
    const a = adapters[gi];
    if (local[gi] < a.count) {
      out.push({ gameId: a.gameId, localIndex: local[gi] });
      local[gi] += 1;
      remaining -= 1;
    }
    gi = (gi + 1) % adapters.length;
  }
  return out;
}
