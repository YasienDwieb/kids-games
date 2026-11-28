import { reportError } from '@/sdk/errors/report';
import type { Moment } from './types';
import { validateMoments } from './validate';

let registered: Moment[] = [];

/**
 * Called once by the app's content (`src/content/moments`). Unsourced or
 * unreviewed moments are dropped and reported, never shown.
 */
export function registerMoments(list: readonly Moment[]): void {
  const { moments, dropped } = validateMoments(list);
  if (dropped.length > 0) reportError(new Error(`moments dropped: ${dropped.join('; ')}`), 'moments');
  registered = moments;
}

export function getMoments(): readonly Moment[] {
  return registered;
}

/** Test-only. */
export function resetMomentsForTests(): void {
  registered = [];
}
