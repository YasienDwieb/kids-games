// The Voice Studio's "Play all" queue. Each run carries a generation number; anything
// that changes course (next, prev, pause, start, stop) bumps it, so a superseded loop
// always exits instead of skipping ahead or playing alongside the new one.

/**
 * play(item, index, total) → Promise that settles when the clip ends or is cut off.
 * stop() cuts off the clip that is playing. gap() → Promise for the pause between clips.
 * onChange({ running, index, total, done }) reports progress.
 */
export function createQueue({ play, stop, gap, onChange = () => {} }) {
  let list = [];
  let index = 0;
  let gen = 0;
  let running = false;

  const report = (done = false) => onChange({ running, index, total: list.length, done });

  async function loop(g) {
    running = true;
    report();
    while (g === gen && index < list.length) {
      await play(list[index], index, list.length);
      if (g !== gen) return;
      index++;
      if (index < list.length) await gap();
    }
    if (g !== gen) return;
    running = false;
    report(true);
    list = []; // finished: the next toggle starts over on what's in view
    index = 0;
  }

  /** Cut off whatever is playing and run again from `index`. */
  function jump(to) {
    gen++;
    stop();
    index = Math.max(0, Math.min(to, list.length - 1));
    loop(gen);
  }

  return {
    get running() {
      return running;
    },
    get index() {
      return index;
    },
    start(items) {
      list = items;
      if (list.length) jump(0);
    },
    /** Pause when playing; otherwise resume, or start on `itemsIfIdle()` when nothing is queued. */
    toggle(itemsIfIdle) {
      if (running) return this.stop();
      if (!list.length) list = itemsIfIdle();
      if (list.length) jump(index);
    },
    next() {
      if (list.length) jump(index + 1);
    },
    prev() {
      if (list.length) jump(index - 1);
    },
    /** End the run here; resuming picks up at the same clip. */
    stop() {
      gen++;
      stop();
      running = false;
      report();
    },
  };
}
