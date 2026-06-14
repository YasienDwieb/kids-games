// Echo — game constants (no UI, no React imports).
// Pad colors reference ACCENTS design tokens; intent strings are bare
// (no `sfx.` prefix) as required by useSound().play(intent).

import { ACCENTS, COLORS } from '@/sdk';

// ---------------------------------------------------------------------------
// Echo-specific pad colors — gold has no ACCENTS family in the design system.
// These two values are the only raw hex literals permitted in Echo UI files;
// all other colors must use COLORS / ACCENTS tokens.
// ---------------------------------------------------------------------------

/** Gold pad deep-edge shade (socket / pressed face). No ACCENTS equivalent. */
const GOLD_DEEP = '#D9A218';

/** Gold pad tint (soft background fill). No ACCENTS equivalent. */
const GOLD_TINT = '#FCF1CF';

// ---------------------------------------------------------------------------
// Pad count
// ---------------------------------------------------------------------------

/** Number of pads shown to the player at the start of a session. */
export const INITIAL_PAD_COUNT = 3;

/** Maximum number of pads the game ever grows to. */
export const MAX_PAD_COUNT = 4;

// ---------------------------------------------------------------------------
// Playback timing (milliseconds)
// ---------------------------------------------------------------------------

/** How long a single pad stays "lit" during sequence playback (ms). */
export const PLAYBACK_LIT_MS = 600;

/** Gap between consecutive lit pads during playback (ms). */
export const PLAYBACK_GAP_MS = 300;

// Minimum values at maximum difficulty — playback speeds up as rounds grow.
/** Shortest time a pad stays lit (reached at high rounds). */
export const PLAYBACK_LIT_MS_MIN = 250;

/** Shortest gap between pads (reached at high rounds). */
export const PLAYBACK_GAP_MS_MIN = 120;

// ---------------------------------------------------------------------------
// Pad colors — colorblind-safe palette, one family per pad index.
// Mapped to mockup intent: pad0=blue/star, pad1=orange/heart,
// pad2=gold/circle, pad3=violet/square.
// Must use SDK tokens only (no raw hex in components).
// ---------------------------------------------------------------------------

/**
 * Color descriptors for each pad.
 * Index corresponds to PadId:
 *   0 = blue  (star)
 *   1 = orange (heart)
 *   2 = gold  (circle)
 *   3 = purple (square)
 */
export const PAD_COLORS: ReadonlyArray<{
  base: string;
  deep: string;
  tint: string;
}> = [
  ACCENTS.blue,     // pad 0 — blue star
  ACCENTS.orange,   // pad 1 — orange heart
  // Gold: COLORS.gold is #F6C747; GOLD_DEEP/GOLD_TINT are Echo-specific constants
  // (gold has no ACCENTS family — see top of file).
  { base: COLORS.gold, deep: GOLD_DEEP, tint: GOLD_TINT },
  ACCENTS.purple,   // pad 3 — violet square
] as const;

// ---------------------------------------------------------------------------
// Pad icon shapes — one shape per pad index (rendered without SVG)
// ---------------------------------------------------------------------------

export type PadShape = 'star' | 'heart' | 'circle' | 'square';

/** Maps padId to its fixed icon shape. */
export const PAD_SHAPES: ReadonlyArray<PadShape> = [
  'star',   // pad 0
  'heart',  // pad 1
  'circle', // pad 2
  'square', // pad 3
] as const;

// ---------------------------------------------------------------------------
// Pad → sound intent mapping
// ---------------------------------------------------------------------------

/**
 * Maps each pad index to a distinct bare `useSound` intent string.
 *
 *  pad 0 (blue)   → 'pop'     — bright UI blip
 *  pad 1 (orange) → 'jump'    — energetic bounce tone
 *  pad 2 (gold)   → 'powerup' — satisfying upgrade chime
 *  pad 3 (purple) → 'laser'   — sharp, distinct zap
 *
 * Each intent resolves to 5 randomised audio variants; `useSound` picks one
 * at runtime so repeated presses never feel monotonous.
 */
export const PAD_SOUND_INTENTS: ReadonlyArray<string> = [
  'pop',      // pad 0
  'jump',     // pad 1
  'powerup',  // pad 2
  'laser',    // pad 3
] as const;

// ---------------------------------------------------------------------------
// Feedback sound intents (used by UI layer, defined here for co-location)
// ---------------------------------------------------------------------------

/** Played when the player's full input matches the sequence. */
export const SOUND_CORRECT_SEQUENCE = 'success';

/** Played when the player taps the wrong pad. */
export const SOUND_WRONG = 'wrong';
