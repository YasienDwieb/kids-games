import { CHALLENGES } from '../constants';
import { challengeHex, endlessChallenge, isChallengeMet, mixHex, recipeCounts } from '../utils';

describe('challenge recipes', () => {
  it.each(CHALLENGES.map((c) => [c.id, c] as const))('%s: its recipe makes the target', (_id, c) => {
    expect(isChallengeMet(mixHex(c.recipe), challengeHex(c))).toBe(true);
  });
});

describe('endless challenges', () => {
  it('are deterministic per number', () => {
    expect(endlessChallenge(4)).toEqual(endlessChallenge(4));
  });

  it('are always solvable by their own recipe', () => {
    for (let n = 1; n <= 60; n++) {
      const c = endlessChallenge(n);
      expect(c.endless).toBe(true);
      expect(c.recipe.length).toBeGreaterThanOrEqual(2);
      expect(isChallengeMet(mixHex(c.recipe), challengeHex(c))).toBe(true);
    }
  });

  it('vary', () => {
    const hexes = new Set(Array.from({ length: 20 }, (_, i) => endlessChallenge(i + 1).targetHex));
    expect(hexes.size).toBeGreaterThan(10);
  });
});

it('recipeCounts groups drops in palette order', () => {
  expect(recipeCounts(['white', 'red', 'white'])).toEqual([
    ['red', 1],
    ['white', 2],
  ]);
});
