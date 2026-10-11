import { useEffect, useState } from 'react';
import { createStore } from '@/sdk/storage/createStore';
import type { OutfitSlot } from './outfits';

/** What Lulu is wearing right now, one item per slot (kg:outfit). */
export type Wearing = Record<OutfitSlot, string | null>;

export const DEFAULT_WEARING: Wearing = { hat: null, glasses: null };

export const outfitStore = createStore<Wearing>('outfit', DEFAULT_WEARING);

/** Put an item on (or take the slot off with `null`). */
export async function wear(slot: OutfitSlot, id: string | null): Promise<void> {
  const cur = await outfitStore.get();
  await outfitStore.set({ ...cur, [slot]: id });
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
