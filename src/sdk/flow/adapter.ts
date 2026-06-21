import type { ReactNode } from 'react';

/**
 * A single playable step in the guided flow. Content-first: the unit renders
 * its own interactive view (typically a game's existing round/puzzle component)
 * and calls `onComplete` when the child succeeds. Scoreless by design.
 */
export type FlowUnit = {
  /** Stable key for React reconciliation + transitions. */
  key: string;
  /** Render the interactive content; call `onComplete` on success. */
  render: (onComplete: () => void) => ReactNode;
};

/**
 * A game's capability to feed its existing content into the guided flow.
 * Games "opt in" by registering an adapter; the flow then auto-includes the
 * game's internal content with no per-topic authoring.
 */
export type FlowAdapter = {
  gameId: string;
  /** Number of distinct units this game contributes to one journey (finite). */
  count: number;
  /** Build the unit for this game's local content index `i` (0-based), seeded per session. */
  unitAt: (i: number, seed: number) => FlowUnit;
};

const adapters = new Map<string, FlowAdapter>();

/** Register a game's flow adapter (idempotent by gameId). */
export function registerFlowAdapter(adapter: FlowAdapter): void {
  adapters.set(adapter.gameId, adapter);
}

export function getFlowAdapter(gameId: string): FlowAdapter | undefined {
  return adapters.get(gameId);
}

/** All registered adapters, in registration order. */
export function getAllFlowAdapters(): FlowAdapter[] {
  return [...adapters.values()];
}

/** Ids of games eligible for guided mode (i.e. that registered an adapter). */
export function eligibleGameIds(): string[] {
  return [...adapters.keys()];
}

/**
 * The adapters the flow should pull from, given the parent's selection.
 * `null` = all eligible games; otherwise the listed games (registration order
 * preserved, unknown/ineligible ids ignored).
 */
export function selectedAdapters(flowGameIds: string[] | null): FlowAdapter[] {
  const all = getAllFlowAdapters();
  if (flowGameIds == null) return all;
  const wanted = new Set(flowGameIds);
  return all.filter((a) => wanted.has(a.gameId));
}

/** Test-only: clear the adapter registry between tests. */
export function resetFlowAdaptersForTests(): void {
  adapters.clear();
}
