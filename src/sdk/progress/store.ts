import { createStore, type Store } from '@/sdk/storage/createStore';

export type Progress = {
  level: number; // 1-based current level
  score: number; // cumulative score / stars
  updatedAt: number; // epoch ms ("last played")
};

// updatedAt: 0 is the sentinel for "never played".
export const DEFAULT_PROGRESS: Progress = { level: 1, score: 0, updatedAt: 0 };

/** Per-game progress checkpoint. Key becomes kg:progress:<gameId>. */
export function createProgressStore(gameId: string): Store<Progress> {
  return createStore<Progress>(`progress:${gameId}`, DEFAULT_PROGRESS);
}
