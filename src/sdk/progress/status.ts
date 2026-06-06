import type { Progress } from './store';

export type ResumeStatus = 'loading' | 'resumable' | 'playing';

/**
 * Decide whether saved progress is worth resuming. 'resumable' when the player
 * got past a fresh start (reached level > 1 or earned a score); else 'playing'.
 */
export function resumeStatusFor(progress: Progress): Exclude<ResumeStatus, 'loading'> {
  return progress.level > 1 || progress.score > 0 ? 'resumable' : 'playing';
}
