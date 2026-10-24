import { createStore } from '@/sdk';

export type TraceProgress = { done: Record<string, 1 | 2 | 3> };

export const progressStore = createStore<TraceProgress>('trace-it', { done: {} });

export async function recordStars(id: string, stars: 1 | 2 | 3): Promise<void> {
  const cur = await progressStore.get();
  const prev = cur.done[id] ?? 0;
  if (stars <= prev) return;
  await progressStore.set({ ...cur, done: { ...cur.done, [id]: stars } });
}

export function charStars(perStroke: readonly (1 | 2 | 3)[]): 1 | 2 | 3 {
  if (perStroke.length === 0) return 3;
  return Math.min(...perStroke) as 1 | 2 | 3;
}
