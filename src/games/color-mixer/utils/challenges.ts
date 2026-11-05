import { COLORS } from '../constants';
import { colorDistance, FAMOUS_IDS } from './match';
import { mixHex, PIGMENT_IDS } from './wheelMix';
import type { Challenge, PigmentId } from '../types';

/** The colour a challenge asks for. */
export function challengeHex(c: Challenge): string {
  return c.targetHex ?? (c.targetColor ? COLORS[c.targetColor].hex : '#FFFFFF');
}

/** Small seeded PRNG (mulberry32), so a numbered endless challenge is always the same. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Enough ΔE00 from every famous colour that a mystery colour is genuinely new. */
const MIN_DISTANCE_FROM_FAMOUS = 8;

/**
 * Endless "mystery colour" #n (1-based): a random recipe of 2–5 drops. The first ones
 * use two pigments; later ones mix three and add white or black, so it keeps getting
 * harder without ever ending.
 */
export function endlessChallenge(n: number): Challenge {
  const rand = rng(n * 7919 + 17);
  const pick = (from: readonly PigmentId[]) => from[Math.floor(rand() * from.length)];
  const kinds = n <= 3 ? 2 : n <= 8 ? 2 + Math.floor(rand() * 2) : 3;
  for (let attempt = 0; attempt < 50; attempt++) {
    const chosen: PigmentId[] = [];
    while (chosen.length < kinds) {
      const p = pick(PIGMENT_IDS);
      if (!chosen.includes(p)) chosen.push(p);
    }
    // Black is strong: one drop of it, never most of the pot.
    const recipe: PigmentId[] = [...chosen];
    const extra = n <= 3 ? 0 : Math.floor(rand() * 3);
    for (let i = 0; i < extra; i++) {
      const p = pick(chosen.filter((c) => c !== 'black'));
      if (p) recipe.push(p);
    }
    const hex = mixHex(recipe);
    if (!hex) continue;
    const near = FAMOUS_IDS.some((id) => colorDistance(hex, COLORS[id].hex) < MIN_DISTANCE_FROM_FAMOUS);
    if (near) continue;
    return {
      id: `e${n}`,
      targetHex: hex,
      recipe: recipe.sort((a, b) => PIGMENT_IDS.indexOf(a) - PIGMENT_IDS.indexOf(b)),
      difficulty: recipe.length <= 2 ? 'easy' : recipe.length <= 3 ? 'medium' : 'hard',
      endless: true,
    };
  }
  // Practically unreachable; a plain two-pigment mix is always a valid fallback.
  const recipe: PigmentId[] = ['red', 'yellow', 'yellow'];
  return { id: `e${n}`, targetHex: mixHex(recipe) ?? '#F57C00', recipe, difficulty: 'easy', endless: true };
}

/** How many of each pigment a recipe uses, in palette order: [['red', 1], ['white', 2]]. */
export function recipeCounts(recipe: readonly PigmentId[]): [PigmentId, number][] {
  return PIGMENT_IDS.map((p) => [p, recipe.filter((r) => r === p).length] as [PigmentId, number]).filter(
    ([, n]) => n > 0,
  );
}
