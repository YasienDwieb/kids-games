/**
 * Shape Detective — deterministic puzzle builders.
 *
 * Each builder accepts a `seed` so tests are fully deterministic.
 * In production the caller can pass any integer (e.g. level * 137).
 * Math.random() is never used here.
 */

import { SHAPE_KINDS, SHAPE_COLORS, SHAPE_SIZES } from '../constants';
import type {
  Shape,
  ShapeKind,
  ShapeSize,
  PatternPuzzle,
  OddOneOutPuzzle,
  SortPuzzle,
  SortBin,
} from '../types';

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (fast, good statistical quality for games)
// ---------------------------------------------------------------------------

/** Returns a stateful PRNG function from a 32-bit integer seed. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Attribute-pool helpers
// ---------------------------------------------------------------------------

type AttributeSet = {
  kinds: ReadonlyArray<ShapeKind>;
  colors: ReadonlyArray<string>;
  sizes: ReadonlyArray<ShapeSize>;
};

/** Narrow the full attribute pools to `count` items each (diversity ≤ count). */
function narrowPools(count: number, rand: () => number): AttributeSet {
  const k = shuffled(SHAPE_KINDS as ShapeKind[], rand).slice(0, Math.max(count, 2));
  const c = shuffled(SHAPE_COLORS as string[], rand).slice(0, Math.max(count, 2));
  const s = shuffled(SHAPE_SIZES as ShapeSize[], rand).slice(0, Math.max(count, 2));
  return { kinds: k, colors: c, sizes: s };
}

/** Fisher-Yates shuffle — returns a new array, does not mutate. */
function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick a random element from an array. */
function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/** Pick an element at a specific index modulo length (safe wrap). */
function at<T>(arr: readonly T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

// ---------------------------------------------------------------------------
// Shape factories
// ---------------------------------------------------------------------------

/**
 * Build a shape with fixed attributes. Attributes not in `activeAttributes`
 * are held constant so only the active dimensions carry signal.
 */
function makeShape(
  kindIdx: number,
  colorIdx: number,
  sizeIdx: number,
  pools: AttributeSet,
  activeAttributes: ReadonlyArray<'kind' | 'color' | 'size'>,
  baseline: Shape,
): Shape {
  return {
    kind: activeAttributes.includes('kind') ? at(pools.kinds, kindIdx) : baseline.kind,
    color: activeAttributes.includes('color') ? at(pools.colors, colorIdx) : baseline.color,
    size: activeAttributes.includes('size') ? at(pools.sizes, sizeIdx) : baseline.size,
  };
}

/** Check two shapes are identical on all three attributes. */
function shapesEqual(a: Shape, b: Shape): boolean {
  return a.kind === b.kind && a.color === b.color && a.size === b.size;
}

// ---------------------------------------------------------------------------
// Pattern puzzle builder
// ---------------------------------------------------------------------------

/**
 * Generates a "what comes next?" pattern puzzle.
 *
 * Strategy: build a repeating 2- or 3-element cycle using the active
 * attributes, show (cycleLen × reps) visible shapes, and ask for the next.
 * Distractors differ from the correct answer on at least one active attribute.
 */
export function buildPatternPuzzle(
  seed: number,
  activeAttributes: ReadonlyArray<'kind' | 'color' | 'size'>,
  optionCount: number,
): PatternPuzzle {
  const rand = mulberry32(seed);
  const pools = narrowPools(3, rand);

  // Baseline shape for inactive attributes
  const baseline: Shape = {
    kind: pools.kinds[0],
    color: pools.colors[0],
    size: pools.sizes[0],
  };

  // Cycle length grows with attribute count but stays 2 or 3
  const cycleLen = activeAttributes.length >= 2 ? 3 : 2;

  // Build cycle elements — each step increments one attribute index
  const cycle: Shape[] = [];
  for (let i = 0; i < cycleLen; i++) {
    cycle.push(makeShape(i, i, i, pools, activeAttributes, baseline));
  }

  // Full visible sequence = 2 complete cycles
  const reps = 2;
  const sequence: Shape[] = [];
  for (let r = 0; r < reps; r++) {
    for (const s of cycle) {
      sequence.push({ ...s });
    }
  }

  // Correct next = sequence[0] % cycle  (continues the cycle)
  const correctShape: Shape = { ...cycle[sequence.length % cycleLen] };

  // Build distractors: mutate exactly one active attribute of the correct shape
  const distractors: Shape[] = [];
  const attrsToMutate = [...activeAttributes];
  let attemptSeed = seed + 1000;

  while (distractors.length < optionCount - 1) {
    const dRand = mulberry32(attemptSeed++);
    const attrIdx = Math.floor(dRand() * attrsToMutate.length);
    const attr = attrsToMutate[attrIdx];

    let candidate: Shape = { ...correctShape };
    if (attr === 'kind') {
      const alt = pools.kinds.filter((k) => k !== correctShape.kind);
      if (alt.length > 0) candidate = { ...candidate, kind: pick(alt, dRand) };
    } else if (attr === 'color') {
      const alt = pools.colors.filter((c) => c !== correctShape.color);
      if (alt.length > 0) candidate = { ...candidate, color: pick(alt, dRand) };
    } else {
      const alt = pools.sizes.filter((s) => s !== correctShape.size);
      if (alt.length > 0) candidate = { ...candidate, size: pick(alt, dRand) };
    }

    // Reject duplicates (against correct and existing distractors)
    const isDupe =
      shapesEqual(candidate, correctShape) ||
      distractors.some((d) => shapesEqual(d, candidate));
    if (!isDupe) {
      distractors.push(candidate);
    }

    // Safety: if we exhaust variations just mirror with a guaranteed diff
    if (attemptSeed > seed + 10000) {
      const fallback: Shape = {
        kind: pools.kinds[distractors.length % pools.kinds.length],
        color: pools.colors[(distractors.length + 1) % pools.colors.length],
        size: pools.sizes[(distractors.length + 2) % pools.sizes.length],
      };
      if (!shapesEqual(fallback, correctShape) && !distractors.some((d) => shapesEqual(d, fallback))) {
        distractors.push(fallback);
      }
      attemptSeed++;
    }
  }

  // Place correct answer at a random position
  const options: Shape[] = [...distractors];
  const correctIndex = Math.floor(rand() * optionCount);
  options.splice(correctIndex, 0, correctShape);

  return {
    type: 'pattern',
    sequence,
    options: options.slice(0, optionCount),
    correctIndex,
  };
}

// ---------------------------------------------------------------------------
// Odd-one-out puzzle builder
// ---------------------------------------------------------------------------

/**
 * Generates an odd-one-out puzzle.
 *
 * Strategy: pick one "majority" shape value per active attribute, fill
 * (itemCount - 1) identical majority shapes, then produce one shape
 * that differs on exactly one active attribute. Place it at random.
 */
export function buildOddOneOutPuzzle(
  seed: number,
  activeAttributes: ReadonlyArray<'kind' | 'color' | 'size'>,
  itemCount: number,
): OddOneOutPuzzle {
  const rand = mulberry32(seed);
  const pools = narrowPools(4, rand);

  // Majority shape — all actives at index 0 of their pool
  const majority: Shape = {
    kind: pools.kinds[0],
    color: pools.colors[0],
    size: pools.sizes[0],
  };

  // Odd shape — differs on the first active attribute
  const oddAttr = activeAttributes[Math.floor(rand() * activeAttributes.length)];
  const odd: Shape = { ...majority };

  if (oddAttr === 'kind' && pools.kinds.length > 1) {
    odd.kind = pools.kinds[1];
  } else if (oddAttr === 'color' && pools.colors.length > 1) {
    odd.color = pools.colors[1];
  } else if (oddAttr === 'size' && pools.sizes.length > 1) {
    odd.size = pools.sizes[1];
  } else {
    // Fallback: always differ on kind (pools guaranteed ≥ 2 by narrowPools)
    odd.kind = pools.kinds[1];
  }

  // Build item list: (itemCount-1) majority + 1 odd
  const majority_items: Shape[] = Array.from({ length: itemCount - 1 }, () => ({ ...majority }));
  const correctIndex = Math.floor(rand() * itemCount);
  const items: Shape[] = [...majority_items];
  items.splice(correctIndex, 0, { ...odd });

  return {
    type: 'oddOneOut',
    items,
    correctIndex,
  };
}

// ---------------------------------------------------------------------------
// Sort puzzle builder
// ---------------------------------------------------------------------------

/**
 * Generates a sort puzzle.
 *
 * Strategy: pick one active attribute as the sorting key, create 2 bins
 * (one per distinct value of that attribute), then populate `items` with
 * shapes that each belong clearly to one bin.
 */
export function buildSortPuzzle(
  seed: number,
  activeAttributes: ReadonlyArray<'kind' | 'color' | 'size'>,
  itemCount: number,
): SortPuzzle {
  const rand = mulberry32(seed);
  const pools = narrowPools(4, rand);

  // Choose the sorting attribute (prefer kind → color → size in order)
  const sortAttr: 'kind' | 'color' | 'size' =
    activeAttributes.includes('kind')
      ? 'kind'
      : activeAttributes.includes('color')
      ? 'color'
      : 'size';

  // Build exactly 2 bins — always solvable even with a single active attribute
  const binValues: string[] =
    sortAttr === 'kind'
      ? [pools.kinds[0], pools.kinds[1] ?? pools.kinds[0]]
      : sortAttr === 'color'
      ? [pools.colors[0], pools.colors[1] ?? pools.colors[0]]
      : [pools.sizes[0], pools.sizes[1] ?? pools.sizes[0]];

  const bins: SortBin[] = [
    { attribute: sortAttr, value: binValues[0] },
    { attribute: sortAttr, value: binValues[1] },
  ];

  // Generate items: evenly split across the two bins, non-sorting attributes vary
  const items: Shape[] = [];
  const assignments: number[] = [];

  for (let i = 0; i < itemCount; i++) {
    const binIdx = i % 2; // alternating so both bins get items
    const binValue = binValues[binIdx];

    const shape: Shape = {
      kind: sortAttr === 'kind' ? (binValue as ShapeKind) : at(pools.kinds, i),
      color: sortAttr === 'color' ? binValue : at(pools.colors, i),
      size: sortAttr === 'size' ? (binValue as ShapeSize) : at(pools.sizes, i),
    };
    items.push(shape);
    assignments.push(binIdx);
  }

  // Shuffle items + assignments together so bin-0 items aren't always first
  const indices = shuffled(
    Array.from({ length: items.length }, (_, i) => i),
    rand,
  );
  const shuffledItems = indices.map((i) => items[i]);
  const shuffledAssignments = indices.map((i) => assignments[i]);

  return {
    type: 'sort',
    items: shuffledItems,
    bins,
    assignments: shuffledAssignments,
  };
}
