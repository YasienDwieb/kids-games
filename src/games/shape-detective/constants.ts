import { ACCENTS, COLORS } from '@/sdk';
import type { ShapeKind, ShapeSize } from './types';

// ---------------------------------------------------------------------------
// Shape kinds
// ---------------------------------------------------------------------------

export const SHAPE_KINDS: ReadonlyArray<ShapeKind> = [
  'circle',
  'square',
  'triangle',
  'star',
  'heart',
  'diamond',
];

// ---------------------------------------------------------------------------
// Color palette — accent bases + tints, keyed from the design system.
// No raw hex here; values are pulled from ACCENTS / COLORS tokens.
// ---------------------------------------------------------------------------

/** Opaque color strings drawn from the SDK design tokens. */
export const SHAPE_COLORS: ReadonlyArray<string> = [
  ACCENTS.purple.base,  // game accent
  ACCENTS.blue.base,
  ACCENTS.green.base,
  ACCENTS.coral.base,
  ACCENTS.orange.base,
  ACCENTS.pink.base,
  ACCENTS.purple.deep,
  ACCENTS.blue.deep,
] as const;

/** Tint fills (soft background versions), same token ordering as SHAPE_COLORS. */
export const SHAPE_TINTS: ReadonlyArray<string> = [
  ACCENTS.purple.tint,
  ACCENTS.blue.tint,
  ACCENTS.green.tint,
  ACCENTS.coral.tint,
  ACCENTS.orange.tint,
  ACCENTS.pink.tint,
  ACCENTS.purple.tint,
  ACCENTS.blue.tint,
] as const;

// ---------------------------------------------------------------------------
// Size steps
// ---------------------------------------------------------------------------

export const SHAPE_SIZES: ReadonlyArray<ShapeSize> = ['small', 'medium', 'large'];

/** Pixel diameter used by the UI layer for each size bucket. */
export const SHAPE_SIZE_PX: Record<ShapeSize, number> = {
  small: 40,
  medium: 64,
  large: 88,
};

// ---------------------------------------------------------------------------
// Puzzle generation limits
// ---------------------------------------------------------------------------

/** Minimum number of items shown in odd-one-out and pattern options. */
export const MIN_OPTION_COUNT = 3;

/** Maximum number of options shown at the hardest level. */
export const MAX_OPTION_COUNT = 5;

/** Color used for correct-answer highlights in the UI layer (matches game accent). */
export const CORRECT_COLOR = ACCENTS.purple.base;

/** Color used for wrong-answer feedback. */
export const WRONG_COLOR = ACCENTS.coral.base;

/** Canvas background — matches the warm canvas token. */
export const BACKGROUND_COLOR = COLORS.canvas;
