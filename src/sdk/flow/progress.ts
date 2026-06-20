import { createStore, type Store } from '@/sdk/storage/createStore';
import type { Topic } from './curriculum';

export type FlowProgress = { topicId: string; unitIndex: number; updatedAt: number };

/** topicId '' + updatedAt 0 is the "never started" sentinel. */
export const DEFAULT_FLOW_PROGRESS: FlowProgress = { topicId: '', unitIndex: 0, updatedAt: 0 };

/** Single guided-journey checkpoint. Key becomes kg:flow:progress. */
export function createFlowProgressStore(): Store<FlowProgress> {
  return createStore<FlowProgress>('flow:progress', DEFAULT_FLOW_PROGRESS);
}

export type FlowPosition =
  | { done: false; topicId: string; unitIndex: number }
  | { done: true };

export function resolveStart(topics: Topic[], saved: FlowProgress): FlowPosition {
  if (topics.length === 0) return { done: true };
  const topic = topics.find((t) => t.id === saved.topicId);
  if (!topic) return { done: false, topicId: topics[0].id, unitIndex: 0 };
  const unitIndex = saved.unitIndex >= 0 && saved.unitIndex < topic.unitIds.length ? saved.unitIndex : 0;
  return { done: false, topicId: topic.id, unitIndex };
}

export function advancePosition(
  topics: Topic[],
  pos: { topicId: string; unitIndex: number },
): FlowPosition {
  const ti = topics.findIndex((t) => t.id === pos.topicId);
  if (ti < 0) return { done: true };
  const topic = topics[ti];
  if (pos.unitIndex + 1 < topic.unitIds.length) {
    return { done: false, topicId: topic.id, unitIndex: pos.unitIndex + 1 };
  }
  if (ti + 1 < topics.length) {
    return { done: false, topicId: topics[ti + 1].id, unitIndex: 0 };
  }
  return { done: true };
}
