import type { ColorId, ColorData, ColorRecipe } from './types';

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
    hex: '#FF9800',
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
    hex: '#6D4C41',
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
    hex: '#EC407A',
    isPrimary: false,
    isUnlocked: false,
  },
  lightBlue: {
    id: 'lightBlue',
    name: 'Light Blue',
    hex: '#29B6F6',
    isPrimary: false,
    isUnlocked: false,
  },
};

export const COLOR_RECIPES: ColorRecipe[] = [
  { ingredients: ['red', 'yellow'], result: 'orange' },
  { ingredients: ['yellow', 'blue'], result: 'green' },
  { ingredients: ['red', 'blue'], result: 'purple' },
  { ingredients: ['red', 'yellow', 'blue'], result: 'brown' },
  { ingredients: ['red', 'white'], result: 'pink' },
  { ingredients: ['blue', 'white'], result: 'lightBlue' },
];

export const DIMENSIONS = {
  COLOR_BLOB_SIZE: 70,
  MIXING_ZONE_SIZE: 150,
  PALETTE_ITEM_SIZE: 60,
};

export const TIMING = {
  MIX_ANIMATION_DURATION: 800,
  DISCOVERY_CELEBRATION_DURATION: 2500,
  COLOR_SPAWN_DELAY: 200,
};

export const GAME_BG = '#F5F5F5';
