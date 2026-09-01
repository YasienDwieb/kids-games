import type { Challenge, ColorId, ColorData } from './types';

export const COLORS: Record<ColorId, ColorData> = {
  red: {
    id: 'red',
    name: 'Red',
    hex: '#E53935',
    isPrimary: true,
    isUnlocked: true,
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow',
    hex: '#FDD835',
    isPrimary: true,
    isUnlocked: true,
  },
  blue: {
    id: 'blue',
    name: 'Blue',
    hex: '#1E88E5',
    isPrimary: true,
    isUnlocked: true,
  },
  orange: {
    id: 'orange',
    name: 'Orange',
    hex: '#F57C00',
    isPrimary: false,
    isUnlocked: false,
  },
  green: {
    id: 'green',
    name: 'Green',
    hex: '#43A047',
    isPrimary: false,
    isUnlocked: false,
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    hex: '#8E24AA',
    isPrimary: false,
    isUnlocked: false,
  },
  brown: {
    id: 'brown',
    name: 'Brown',
    hex: '#916146',
    isPrimary: false,
    isUnlocked: false,
  },
  white: {
    id: 'white',
    name: 'White',
    hex: '#FAFAFA',
    isPrimary: true,
    isUnlocked: true,
  },
  black: {
    id: 'black',
    name: 'Black',
    hex: '#212121',
    isPrimary: true,
    isUnlocked: true,
  },
  pink: {
    id: 'pink',
    name: 'Pink',
    hex: '#F09A98',
    isPrimary: false,
    isUnlocked: false,
  },
  lightBlue: {
    id: 'lightBlue',
    name: 'Light Blue',
    hex: '#8CC1F0',
    isPrimary: false,
    isUnlocked: false,
  },
};

export const DIMENSIONS = {
  COLOR_BLOB_SIZE: 70,
  // The zone is sized from measured space (see index.tsx); these bound it. MIN keeps it a
  // usable drop target in challenge-mode landscape, where the panel is shortest.
  MIXING_ZONE_MAX: 180,
  MIXING_ZONE_MIN: 112,
  MIXING_ZONE_MARGIN: 8,
  PALETTE_ITEM_SIZE: 60,
  RESULT_BLOB_SIZE: 100,
};

export const TIMING = {
  MIX_ANIMATION_DURATION: 800,
  DISCOVERY_CELEBRATION_DURATION: 2500,
  COLOR_SPAWN_DELAY: 200,
};

export const DISCOVERY_HINTS: Partial<Record<ColorId, string>> = {
  orange: 'Mix two warm colors',
  green: 'Mix a warm and a cool color',
  purple: 'Mix two bold colors',
  brown: 'Mix all three primary colors',
  pink: 'Add white to a warm color',
  lightBlue: 'Add white to a cool color',
};

export const CHALLENGES: Challenge[] = [
  // Easy — basic secondary colors
  { id: 'c1', targetColor: 'orange', hint: 'Mix a hot color with a sunny color', difficulty: 'easy' },
  { id: 'c2', targetColor: 'green', hint: 'Mix the sky with sunshine', difficulty: 'easy' },
  { id: 'c3', targetColor: 'purple', hint: 'Mix fire with water', difficulty: 'easy' },
  // Medium — requires white or all primaries
  { id: 'c4', targetColor: 'pink', hint: 'Make red lighter', difficulty: 'medium' },
  { id: 'c5', targetColor: 'lightBlue', hint: 'Make blue lighter', difficulty: 'medium' },
  { id: 'c6', targetColor: 'brown', hint: 'Mix ALL the primary colors', difficulty: 'hard' },
];

/**
 * Match thresholds, in CIEDE2000 — pinned to that metric, not RGB distance.
 *
 * The old rule was Euclidean RGB under 60, which is not what an eye does: on the previous
 * palette green (#8EB08D) and brown (#AB8870) sat only 57.3 apart, so a green mix silently
 * satisfied the *brown* challenge. The authored palette separates the closest pair to 100.3
 * RGB / 17.2 ΔE00, and these thresholds are comfortably inside that.
 */
/** A blend this close to a famous color counts as discovering it. */
export const DISCOVERY_DELTA_E = 5;

/** Graded challenge scoring. 1 star is feedback, not completion. */
export const STAR_DELTA_E = { three: 3, two: 6, one: 12 } as const;

/** Stars needed to finish a challenge — ΔE00 12 is still plainly visible. */
export const STARS_TO_COMPLETE = 2;

/** ΔE00 span over which the "getting warmer" meter fills. */
export const METER_RANGE_DELTA_E = 40;
