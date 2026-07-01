/**
 * Per-run order seed — persisted so a resumed session keeps its shuffled order
 * (no confusing letter-jumps mid-run), and only reshuffles on Start Over.
 *
 * Stored under `kg:order:<gameId>` via the SDK store. `read()` returns the
 * stored seed, generating + persisting one on first read; `reroll()` writes a
 * fresh random seed (the only Math.random in this domain — kept out of the pure
 * generator) and returns it.
 */

import { createStore } from '@/sdk';

const randSeed = (): number => Math.floor(Math.random() * 0x7fffffff) || 1;

export function makeOrderSeed(gameId: string) {
  const store = createStore<number>(`order:${gameId}`, 0);
  return {
    async read(): Promise<number> {
      const v = await store.get();
      if (v && v > 0) return v;
      const seed = randSeed();
      await store.set(seed);
      return seed;
    },
    async reroll(): Promise<number> {
      const seed = randSeed();
      await store.set(seed);
      return seed;
    },
  };
}
