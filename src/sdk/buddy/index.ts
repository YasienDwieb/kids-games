/**
 * The child's buddy — the mascot that cheers, explains and hints everywhere.
 * Two to pick from: Lulu the owl (girl) and Zain the lion cub (boy).
 *
 *   const buddy = useBuddy();          // 'lulu' | 'zain'
 *   t(`buddy.${buddy}.name`)
 *
 * The choice lives in settings (`settings.buddy`, null until picked). A
 * module-level copy keeps first renders right after boot, so the 2D poses and
 * the 3D model never flash the wrong character.
 */
import { useEffect, useState } from 'react';
import { settingsStore } from '@/sdk/settings/store';

export const BUDDIES = ['lulu', 'zain'] as const;
export type BuddyId = (typeof BUDDIES)[number];
export const DEFAULT_BUDDY: BuddyId = 'lulu';

let current: BuddyId = DEFAULT_BUDDY;
let picked: boolean | null = null; // null = settings not read yet
const listeners = new Set<() => void>();

function apply(buddy: BuddyId | null) {
  const next = buddy ?? DEFAULT_BUDDY;
  const nextPicked = buddy != null;
  if (next === current && nextPicked === picked) return;
  current = next;
  picked = nextPicked;
  listeners.forEach((fn) => fn());
}

settingsStore
  .get()
  .then((s) => apply(s.buddy))
  .catch(() => apply(null));
settingsStore.subscribe((s) => apply(s.buddy));

/** The buddy right now (Lulu until settings load or a child picks). */
export function currentBuddy(): BuddyId {
  return current;
}

function useBuddyState() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return { buddy: current, picked };
}

/** The chosen buddy, live. */
export function useBuddy(): BuddyId {
  return useBuddyState().buddy;
}

/** Whether a buddy was ever picked: null while settings load, then true/false. */
export function useBuddyPicked(): boolean | null {
  return useBuddyState().picked;
}

/** Pick (or switch) the buddy. */
export async function chooseBuddy(buddy: BuddyId): Promise<void> {
  const cur = await settingsStore.get();
  await settingsStore.set({ ...cur, buddy });
}
