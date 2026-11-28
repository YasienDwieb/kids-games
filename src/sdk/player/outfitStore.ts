import { useEffect, useState } from 'react';
import { createStore } from '@/sdk/storage/createStore';
import type { OutfitSlot } from './outfits';

/** What the buddy is wearing right now, one item per slot (kg:outfit). */
export type Wearing = Record<OutfitSlot, string | null>;

export const DEFAULT_WEARING: Wearing = { hat: null, glasses: null };

export const outfitStore = createStore<Wearing>('outfit', DEFAULT_WEARING);

/** Put an item on (or take the slot off with `null`). */
export async function wear(slot: OutfitSlot, id: string | null): Promise<void> {
  const cur = await outfitStore.get();
  await outfitStore.set({ ...cur, [slot]: id });
}

/** Occasion gifts already shown, as `<companion>:<year>` (kg:outfit-gifts). */
export const giftsStore = createStore<string[]>('outfit-gifts', []);

/** Record a gift as given. Resolves true the first time, false if it was already given. */
export async function unlockGift(id: string): Promise<boolean> {
  const cur = await giftsStore.get();
  if (cur.includes(id)) return false;
  await giftsStore.set([...cur, id]);
  return true;
}

export function useGifts(): string[] {
  const [gifts, setGifts] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    giftsStore.get().then((g) => alive && setGifts(g));
    const unsub = giftsStore.subscribe((g) => alive && setGifts(g));
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return gifts;
}

export function useWearing(): Wearing {
  const [wearing, setWearing] = useState<Wearing>(DEFAULT_WEARING);
  useEffect(() => {
    let alive = true;
    outfitStore.get().then((w) => alive && setWearing(w));
    const unsub = outfitStore.subscribe((w) => alive && setWearing(w));
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return wearing;
}
