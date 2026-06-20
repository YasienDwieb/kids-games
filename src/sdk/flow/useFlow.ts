import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlowUnit, Topic } from './curriculum';
import { getFlowUnit } from './curriculum';
import {
  createFlowProgressStore, resolveStart, advancePosition,
  type FlowPosition, type FlowProgress,
} from './progress';

export type UseFlowResult = {
  status: 'loading' | 'playing' | 'done';
  topicId: string | null;
  unitIndex: number;
  unit: FlowUnit | null;
  advance: () => void;
  reset: () => void;
};

export function useFlow(args: { topics: Topic[] }): UseFlowResult {
  const { topics } = args;
  const store = useMemo(() => createFlowProgressStore(), []);
  const [position, setPosition] = useState<FlowPosition | null>(null); // null = loading
  const topicsRef = useRef(topics);
  topicsRef.current = topics;

  useEffect(() => {
    let mounted = true;
    store.get().then((saved) => {
      if (mounted) setPosition(resolveStart(topicsRef.current, saved));
    });
    return () => { mounted = false; };
  }, [store]);

  const persist = useCallback(
    (pos: FlowPosition) => {
      if (pos.done) return; // 'done' keeps the last in-topic checkpoint; nothing new to save
      const next: FlowProgress = { topicId: pos.topicId, unitIndex: pos.unitIndex, updatedAt: Date.now() };
      store.set(next);
    },
    [store],
  );

  const advance = useCallback(() => {
    setPosition((cur) => {
      if (!cur || cur.done) return cur;
      const next = advancePosition(topicsRef.current, cur);
      persist(next);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    const first = topicsRef.current[0];
    const pos: FlowPosition = first
      ? { done: false, topicId: first.id, unitIndex: 0 }
      : { done: true };
    persist(pos);
    setPosition(pos);
  }, [persist]);

  if (position == null) {
    return { status: 'loading', topicId: null, unitIndex: 0, unit: null, advance, reset };
  }
  if (position.done) {
    return { status: 'done', topicId: null, unitIndex: 0, unit: null, advance, reset };
  }
  const topic = topics.find((t) => t.id === position.topicId);
  const unit = topic ? getFlowUnit(topic.unitIds[position.unitIndex]) ?? null : null;
  return {
    status: 'playing',
    topicId: position.topicId,
    unitIndex: position.unitIndex,
    unit,
    advance,
    reset,
  };
}
