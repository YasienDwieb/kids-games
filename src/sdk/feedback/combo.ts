/**
 * Combo streak — consecutive celebrations (wins) without a miss in between.
 * CelebrationProvider bumps it on every celebrate(); a miss through
 * useHintLadder (or any game calling breakCombo) resets it. A long pause also
 * ends the streak, so it only ever counts a burst of play.
 */
export const COMBO_WINDOW_MS = 20_000;

let count = 0;
let lastAt = 0;

/** Record a win; returns the streak length including it. */
export function bumpCombo(now: number = Date.now()): number {
  count = now - lastAt <= COMBO_WINDOW_MS ? count + 1 : 1;
  lastAt = now;
  return count;
}

/** A miss ends the streak. */
export function breakCombo(): void {
  count = 0;
  lastAt = 0;
}
