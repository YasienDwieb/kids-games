// Shape Detective — core domain types (no UI, no React imports).

// ---------------------------------------------------------------------------
// Primitive attributes
// ---------------------------------------------------------------------------

/** Visual shape kinds supported by the game. */
export type ShapeKind = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond';

/** Relative size bucket. Maps to pixel dimensions in the UI layer. */
export type ShapeSize = 'small' | 'medium' | 'large';

/** A single renderable shape with all three attributes. */
export type Shape = {
  kind: ShapeKind;
  color: string; // opaque color token (hex from the design system, set in constants)
  size: ShapeSize;
};

// ---------------------------------------------------------------------------
// Puzzle types
// ---------------------------------------------------------------------------

export type PuzzleType = 'pattern' | 'oddOneOut' | 'sort';

/**
 * Pattern puzzle — "what comes next?"
 * `sequence` is the visible portion; `options` are the tap choices;
 * `correctIndex` is the 0-based index into `options` of the right answer.
 */
export type PatternPuzzle = {
  type: 'pattern';
  /** Visible shapes in the pattern (excludes the hidden final element). */
  sequence: Shape[];
  /** Tap choices — exactly one is the correct continuation. */
  options: Shape[];
  /** 0-based index into `options` that correctly continues the sequence. */
  correctIndex: number;
};

/**
 * Odd-one-out puzzle — find the shape that doesn't belong.
 * `items` includes the odd one; `correctIndex` points to it.
 */
export type OddOneOutPuzzle = {
  type: 'oddOneOut';
  /** All shapes shown on screen (majority + one odd). */
  items: Shape[];
  /** 0-based index into `items` of the shape that doesn't belong. */
  correctIndex: number;
};

/**
 * Sort puzzle — each shape belongs in exactly one named bin.
 * `items` are draggable shapes; `bins` are drop targets;
 * `assignments[i]` is the bin index that `items[i]` belongs to.
 */
export type SortPuzzle = {
  type: 'sort';
  /** Shapes to be sorted. */
  items: Shape[];
  /**
   * Bin descriptors. Each bin has a label key (matched against a shape
   * attribute value) used by the UI layer to render the bin header.
   */
  bins: SortBin[];
  /** assignments[i] = index into `bins` where items[i] must go. */
  assignments: number[];
};

/** A destination bin in a sort puzzle. */
export type SortBin = {
  /** The attribute used to classify shapes into this bin. */
  attribute: 'kind' | 'color' | 'size';
  /** The value that shapes in this bin share (e.g. 'circle', '#A48BF2', 'large'). */
  value: string;
};

/** Discriminated union of all puzzle variants. */
export type Puzzle = PatternPuzzle | OddOneOutPuzzle | SortPuzzle;

// ---------------------------------------------------------------------------
// Level data
// ---------------------------------------------------------------------------

/** Everything needed to render and evaluate one game level. */
export type LevelData = {
  /** 1-based level number. */
  level: number;
  /** Which attribute(s) are in play for this level ('kind' | 'color' | 'size'). */
  activeAttributes: ReadonlyArray<'kind' | 'color' | 'size'>;
  /** Number of tap options shown to the player. */
  optionCount: number;
  /** The puzzle to solve. */
  puzzle: Puzzle;
};
