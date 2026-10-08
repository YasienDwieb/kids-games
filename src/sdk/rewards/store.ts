import { useEffect, useState } from 'react';
import { createStore } from '@/sdk/storage/createStore';
import { STARS_PER_STICKER, nextSticker } from './stickers';

/**
 * App-wide rewards (kg:rewards). Stars are earned across every game; every
 * STARS_PER_STICKER stars unlocks a sticker for the sticker book. `unseen`
 * holds stickers the child hasn't opened the book to look at yet.
 */
export type Rewards = { stars: number; stickers: string[]; unseen: string[] };

export const DEFAULT_REWARDS: Rewards = { stars: 0, stickers: [], unseen: [] };

export const rewardsStore = createStore<Rewards>('rewards', DEFAULT_REWARDS);

type UnlockListener = (stickerId: string) => void;
const unlockListeners = new Set<UnlockListener>();

/** Be told whenever a new sticker is unlocked (the in-game "New sticker!" toast). */
export function onStickerUnlocked(fn: UnlockListener): () => void {
  unlockListeners.add(fn);
  return () => {
    unlockListeners.delete(fn);
  };
}

// Awards are read-modify-write on one AsyncStorage key; chain them so two quick
// wins can't both read the same total and lose a star.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Give `gameId` some stars (default 1) and unlock any stickers they pay for.
 * Resolves with the stickers unlocked by this award (usually none or one).
 * Safe to fire and forget from game code.
 */
export function awardStars(gameId: string, stars = 1): Promise<string[]> {
  const run = queue.then(async () => {
    if (stars <= 0) return [];
    const cur = await rewardsStore.get();
    const total = cur.stars + stars;
    const owed = Math.floor(total / STARS_PER_STICKER);
    const stickers = [...cur.stickers];
    const unlocked: string[] = [];
    while (stickers.length < owed) {
      const id = nextSticker(gameId, stickers);
      if (!id) break; // book complete — stars still count
      stickers.push(id);
      unlocked.push(id);
    }
    await rewardsStore.set({
      stars: total,
      stickers,
      unseen: [...cur.unseen, ...unlocked],
    });
    unlocked.forEach((id) => unlockListeners.forEach((fn) => fn(id)));
    return unlocked;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Clear the "new" marks once the child has seen the book. */
export async function markStickersSeen(): Promise<void> {
  await queue;
  const cur = await rewardsStore.get();
  if (cur.unseen.length > 0) await rewardsStore.set({ ...cur, unseen: [] });
}

/** Live rewards state for screens (Home pill, sticker book). */
export function useRewards(): Rewards {
  const [rewards, setRewards] = useState<Rewards>(DEFAULT_REWARDS);
  useEffect(() => {
    let alive = true;
    rewardsStore.get().then((r) => {
      if (alive) setRewards(r);
    });
    const unsub = rewardsStore.subscribe((r) => {
      if (alive) setRewards(r);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return rewards;
}
