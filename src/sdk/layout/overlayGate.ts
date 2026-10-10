/**
 * Tracks whether a modal game overlay (GameOverlay's native Modal) is open.
 * A Modal is its own window on top of everything, so toasts drawn in the play
 * screen would expire unseen behind it; they wait for it to close instead.
 */
let open = 0;
const waiters = new Set<() => void>();

export function overlayOpened(): void {
  open += 1;
}

export function overlayClosed(): void {
  open = Math.max(0, open - 1);
  if (open === 0) {
    const run = [...waiters];
    waiters.clear();
    run.forEach((fn) => fn());
  }
}

/** Run `fn` now, or as soon as no modal overlay is covering the game. */
export function whenOverlayClear(fn: () => void): () => void {
  if (open === 0) {
    fn();
    return () => undefined;
  }
  waiters.add(fn);
  return () => {
    waiters.delete(fn);
  };
}
