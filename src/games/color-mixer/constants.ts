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
    hex: '#F18835',
    isPrimary: false,
    isUnlocked: false,
  },
  green: {
    id: 'green',
    name: 'Green',
    hex: '#8EB08D',
    isPrimary: false,
    isUnlocked: false,
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    hex: '#82618D',
    isPrimary: false,
    isUnlocked: false,
  },
  brown: {
    id: 'brown',
    name: 'Brown',
    hex: '#AB8870',
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
  MIXING_ZONE_SIZE: 180,
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

/** Generous RGB (Euclidean) distance under which a blend "matches" a target. */
export const MATCH_THRESHOLD = 60;
