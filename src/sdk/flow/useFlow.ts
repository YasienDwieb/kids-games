import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlowAdapter, FlowUnit } from './adapter';
import { getFlowAdapter } from './adapter';
import { buildSequence, sequenceLength } from './sequence';
import {
  createFlowProgressStore, resolveStart, advanceStep, newSeed,
  type FlowPosition, type FlowProgress,
} from './progress';

export type UseFlowResult = {
  status: 'loading' | 'playing' | 'done';
  step: number;
  total: number;
  unit: FlowUnit | null;
  advance: () => void;
  reset: () => void;
};

/**
 * Drives the guided journey: interleaves the selected games' content into one
 * sequence, resolves/persists the resume step, and resolves the current unit
 * from the responsible game's adapter. Scoreless.
 */
export function useFlow(args: { adapters: FlowAdapter[] }): UseFlowResult {
  const { adapters } = args;
  const store = useMemo(() => createFlowProgressStore(), []);

  const sequence = useMemo(() => buildSequence(adapters), [adapters]);
  const total = useMemo(() => sequenceLength(adapters), [adapters]);
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;

  const [position, setPosition] = useState<FlowPosition | null>(null); // null = loading
  const seedRef = useRef(0);

  // Load the saved checkpoint once; resolve where to resume.
  useEffect(() => {
    let mounted = true;
    store.get().then((saved) => {
      if (!mounted) return;
      seedRef.current = saved.seed > 0 ? saved.seed : newSeed();
      setPosition(resolveStart(sequenceRef.current.length, saved));
    });
    return () => { mounted = false; };
  }, [store]);

  const persist = useCallback(
    (step: number) => {
      const next: FlowProgress = { step, seed: seedRef.current, updatedAt: Date.now() };
      store.set(next);
    },
    [store],
  );

  const advance = useCallback(() => {
    setPosition((cur) => {
      if (!cur || cur.done) return cur;
      const next = advanceStep(sequenceRef.current.length, cur.step);
      // Persist the furthest step reached (done → one past the last unit).
      persist(next.done ? sequenceRef.current.length : next.step);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    seedRef.current = newSeed();
    const pos: FlowPosition =
      sequenceRef.current.length > 0 ? { done: false, step: 0 } : { done: true };
    persist(0);
    setPosition(pos);
  }, [persist]);

  const unit = useMemo<FlowUnit | null>(() => {
    if (position == null || position.done) return null;
    const seqStep = sequence[position.step];
    if (!seqStep) return null;
    const adapter = getFlowAdapter(seqStep.gameId);
    return adapter ? adapter.unitAt(seqStep.localIndex, seedRef.current) : null;
  }, [position, sequence]);

  if (position == null) {
    return { status: 'loading', step: 0, total, unit: null, advance, reset };
  }
  if (position.done) {
    return { status: 'done', step: total, total, unit: null, advance, reset };
  }
  return { status: 'playing', step: position.step, total, unit, advance, reset };
}
