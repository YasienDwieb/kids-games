import type { SavedColor } from '../types';

/** Saved colors ordered most-recent-first, so the latest save sits at the strip's start. */
export function sortSavedNewestFirst(saved: SavedColor[]): SavedColor[] {
  return [...saved].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Route a saved-swatch gesture. A vertical-dominant move past the threshold becomes a
 * lift-drag toward the mixing zone; anything else stays with the horizontal scroller.
 */
export function isVerticalDrag(dx: number, dy: number, threshold = 12): boolean {
  return Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold;
}
