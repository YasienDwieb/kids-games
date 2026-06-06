export interface LevelSource<T> {
  /** Resolve the data/config for a 1-based level number. */
  get(level: number): T;
  /** Total levels if finite; undefined for endless generators. */
  readonly count?: number;
}

/** Authored / hand-made levels. Out-of-range access throws RangeError. */
export function levelsFromList<T>(items: readonly T[]): LevelSource<T> {
  if (items.length === 0) throw new RangeError('levelsFromList requires at least one level');
  return {
    count: items.length,
    get(level) {
      if (level < 1 || level > items.length) {
        throw new RangeError(`Level ${level} out of range (1..${items.length})`);
      }
      return items[level - 1];
    },
  };
}

/**
 * Runtime-generated levels, optionally bounded by a count (undefined = endless).
 * Note: unlike levelsFromList, a bounded generator does not range-check get() —
 * useLevels guards the upper bound via `count` (see isLast / advance clamping).
 */
export function levelsFromGenerator<T>(
  generate: (level: number) => T,
  options: { count?: number } = {},
): LevelSource<T> {
  return { count: options.count, get: generate };
}
