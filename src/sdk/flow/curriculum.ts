import type { ComponentType } from 'react';
import type { Actor } from './actors';

export type FlowUnitContext = { width: number; height: number; rng: () => number };
export type FlowUnitProps = { actors: Actor[]; onComplete: () => void };

export type FlowUnit = {
  id: string;
  topicId: string;
  enterActors: (ctx: FlowUnitContext) => Actor[];
  exitActors: (ctx: FlowUnitContext) => Actor[];
  Component: ComponentType<FlowUnitProps>;
};

export type Topic = { id: string; unitIds: string[] };

const units = new Map<string, FlowUnit>();
const topics: Topic[] = [];

export function registerFlowUnit(unit: FlowUnit): void {
  units.set(unit.id, unit);
}
export function getFlowUnit(id: string): FlowUnit | undefined {
  return units.get(id);
}
export function registerTopic(topic: Topic): void {
  if (!topics.some((t) => t.id === topic.id)) topics.push(topic);
}
export function getAllTopics(): Topic[] {
  return [...topics];
}

/** null → every authored topic; otherwise the listed ids in authored order. */
export function activeTopics(all: Topic[], flowTopicIds: string[] | null): Topic[] {
  if (flowTopicIds == null) return all;
  const wanted = new Set(flowTopicIds);
  return all.filter((t) => wanted.has(t.id));
}

/** Test-only: clear the module-level registry between tests. */
export function resetFlowRegistryForTests(): void {
  units.clear();
  topics.length = 0;
}
