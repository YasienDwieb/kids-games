/**
 * makeOrderSeed — persistence behavior (read stable, reroll changes).
 * Uses the AsyncStorage mock provided by the jest-expo preset.
 */

import { makeOrderSeed } from '../orderStore';

describe('makeOrderSeed', () => {
  it('persists a stable seed across reads', async () => {
    const store = makeOrderSeed('test-game-a');
    const first = await store.read();
    const second = await store.read();
    expect(first).toBeGreaterThan(0);
    expect(second).toBe(first);
  });

  it('reroll writes a fresh seed that subsequent reads return', async () => {
    const store = makeOrderSeed('test-game-b');
    await store.read();
    const after = await store.reroll();
    expect(typeof after).toBe('number');
    expect(after).toBeGreaterThan(0);
    expect(await store.read()).toBe(after);
  });
});
