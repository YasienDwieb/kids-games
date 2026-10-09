import { useCallback, useEffect, useState } from 'react';
import { createStore } from '@/sdk/storage/createStore';

/** Which tutorials the child has already completed (stored under kg:tutorial). */
export type TutorialProgress = { seen: string[] };

export const tutorialStore = createStore<TutorialProgress>('tutorial', { seen: [] });

export type FirstRunStatus = 'loading' | 'show' | 'done';

/**
 * First-run gate for a game's demo. `status` is 'show' until `complete()` is
 * called once, then 'done' forever (per device). Use one id per demo, e.g.
 * 'mouse-maze' or 'color-mixer:drag'.
 */
export function useFirstRun(id: string): { status: FirstRunStatus; complete: () => void } {
  const [status, setStatus] = useState<FirstRunStatus>('loading');

  useEffect(() => {
    let alive = true;
    tutorialStore.get().then((p) => {
      if (alive) setStatus(p.seen.includes(id) ? 'done' : 'show');
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const complete = useCallback(() => {
    setStatus('done');
    void tutorialStore.get().then((p) => {
      if (!p.seen.includes(id)) return tutorialStore.set({ seen: [...p.seen, id] });
    });
  }, [id]);

  return { status, complete };
}
