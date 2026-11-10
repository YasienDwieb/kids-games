/**
 * The child's buddy — the mascot that cheers, explains and hints everywhere.
 * Two to pick from: Mariam and Anas. Mariam has two looks (pigtails, or her
 * hijab) that the child switches in the wardrobe.
 *
 *   const buddy = useBuddy();          // 'mariam' | 'anas'
 *   const art = useBuddyArt();         // 'mariam' | 'mariamHijab' | 'anas'
 *   t(`buddy.${buddy}.name`)
 *
 * The choice lives in settings (`settings.buddy`, null until picked). A
 * module-level copy keeps first renders right after boot, so the 2D poses and
 * the 3D model never flash the wrong character.
 */
import { useEffect, useState } from 'react';
import { settingsStore } from '@/sdk/settings/store';
import { createStore } from '@/sdk/storage/createStore';

export const BUDDIES = ['mariam', 'anas'] as const;
export type BuddyId = (typeof BUDDIES)[number];
export const DEFAULT_BUDDY: BuddyId = 'mariam';

/** A drawn look: each has its own set of pose pictures. */
export type BuddyArt = 'mariam' | 'mariamHijab' | 'anas';

/** Each buddy's looks; the first is the default (and the one on the picker). */
export const BUDDY_LOOKS: Record<BuddyId, readonly BuddyArt[]> = {
  mariam: ['mariam', 'mariamHijab'],
  anas: ['anas'],
};

/** Manifest intent of a buddy's welcome line (`<buddy>.welcome.<lang>`). */
export const welcomeIntent = (buddy: BuddyId, lang: string) => `${buddy}.welcome.${lang}`;

const isBuddy = (v: unknown): v is BuddyId => (BUDDIES as readonly unknown[]).includes(v);

let current: BuddyId = DEFAULT_BUDDY;
let picked: boolean | null = null; // null = settings not read yet
const listeners = new Set<() => void>();

// A choice saved before the current buddies existed (Lulu, Zain) counts as
// unpicked, so those players meet the new buddies in the picker.
function apply(saved: unknown) {
  const buddy = isBuddy(saved) ? saved : null;
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

/** The buddy right now (the default until settings load or a child picks). */
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

type Looks = Partial<Record<BuddyId, BuddyArt>>;
const lookStore = createStore<Looks>('buddy-look', {});
let looks: Looks = {};

function applyLooks(next: Looks) {
  looks = next;
  listeners.forEach((fn) => fn());
}
lookStore.get().then(applyLooks).catch(() => {});
lookStore.subscribe(applyLooks);

function artFor(buddy: BuddyId): BuddyArt {
  const saved = looks[buddy];
  return saved && BUDDY_LOOKS[buddy].includes(saved) ? saved : BUDDY_LOOKS[buddy][0];
}

/** The look a buddy wears now (the chosen buddy unless one is given), live. */
export function useBuddyArt(buddy?: BuddyId): BuddyArt {
  useBuddyState();
  return artFor(buddy ?? current);
}

/** Switch a buddy's look (wardrobe). */
export async function chooseLook(buddy: BuddyId, art: BuddyArt): Promise<void> {
  if (!BUDDY_LOOKS[buddy].includes(art)) return;
  const cur = await lookStore.get();
  await lookStore.set({ ...cur, [buddy]: art });
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
