import type { FlowAdapter } from './adapter';

/** One resolved position in the interleaved journey. */
export type SeqStep = { gameId: string; localIndex: number };

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
