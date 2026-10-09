import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlowAdapter, FlowUnit } from './adapter';
import { getFlowAdapter } from './adapter';
import { buildSequence, sequenceLength } from './sequence';
import {
  createFlowProgressStore, doneCounts, firstOpenStep, legacySequence, newSeed,
  type FlowPosition, type FlowProgress,
} from './progress';

const samePosition = (a: FlowPosition, b: FlowPosition): boolean =>
  a.done ? b.done : !b.done && a.step === b.step;

export type UseFlowResult = {
  status: 'loading' | 'playing' | 'done';
  /** Game that owns the current unit (null when not playing). */
  gameId: string | null;
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
  const adaptersRef = useRef(adapters);
  adaptersRef.current = adapters;

  const [position, setPosition] = useState<FlowPosition | null>(null); // null = loading
  const positionRef = useRef<FlowPosition | null>(null); // live value for advance()
  positionRef.current = position;
  const seedRef = useRef(0);
  // Units finished per game — survives the game list changing between sessions.
  const doneRef = useRef<Record<string, number>>({});
  // A step-only save, until the child moves on: its credit depends on the game
  // selection, which may still be loading, so it's re-derived on every change.
  const legacySaveRef = useRef<FlowProgress | null>(null);

  const positionAt = (step: number): FlowPosition =>
    step >= sequenceRef.current.length ? { done: true } : { done: false, step };

  // Load the saved checkpoint once; resume at the first unfinished unit of the
  // CURRENT sequence (which may differ from the one it was saved against).
  useEffect(() => {
    let mounted = true;
    store.get().then((saved) => {
      if (!mounted) return;
      seedRef.current = saved.seed > 0 ? saved.seed : newSeed();
      legacySaveRef.current = saved.done ? null : saved;
      doneRef.current = doneCounts(legacySequence(adaptersRef.current), saved);
      setPosition(positionAt(firstOpenStep(sequenceRef.current, doneRef.current)));
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  // Settings (the parent's game subset) load async and may land after the
  // checkpoint — re-place the child in whatever the sequence now is.
  useEffect(() => {
    if (positionRef.current == null) return;
    const legacy = legacySaveRef.current;
    if (legacy) doneRef.current = doneCounts(legacySequence(adapters), legacy);
    const next = positionAt(firstOpenStep(sequence, doneRef.current));
    // Bail out when unchanged — callers may pass a fresh (equal) adapters array each render.
    setPosition((prev) => (prev && samePosition(prev, next) ? prev : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence]);

  const persist = useCallback(
    (step: number) => {
      const next: FlowProgress = {
        step,
        seed: seedRef.current,
        updatedAt: Date.now(),
        done: doneRef.current,
      };
      store.set(next);
    },
    [store],
  );

  const advance = useCallback(() => {
    const cur = positionRef.current;
    if (!cur || cur.done) return;
    legacySaveRef.current = null;
    const finished = sequenceRef.current[cur.step];
    if (finished) {
      doneRef.current = {
        ...doneRef.current,
        [finished.gameId]: Math.max(doneRef.current[finished.gameId] ?? 0, finished.localIndex + 1),
      };
    }
    const nextStep = firstOpenStep(sequenceRef.current, doneRef.current);
    persist(nextStep);
    setPosition(positionAt(nextStep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist]);

  const reset = useCallback(() => {
    seedRef.current = newSeed();
    doneRef.current = {};
    legacySaveRef.current = null;
    persist(0);
    setPosition(positionAt(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist]);

  const unit = useMemo<FlowUnit | null>(() => {
    if (position == null || position.done) return null;
    const seqStep = sequence[position.step];
    if (!seqStep) return null;
    const adapter = getFlowAdapter(seqStep.gameId);
    return adapter ? adapter.unitAt(seqStep.localIndex, seedRef.current) : null;
  }, [position, sequence]);

  if (position == null || (!position.done && position.step >= sequence.length)) {
    return { status: 'loading', gameId: null, step: 0, total, unit: null, advance, reset };
  }
  if (position.done) {
    return { status: 'done', gameId: null, step: total, total, unit: null, advance, reset };
  }
  const gameId = sequence[position.step]?.gameId ?? null;
  return { status: 'playing', gameId, step: position.step, total, unit, advance, reset };
}
