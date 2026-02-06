import type { ColorRecipe, AnyColor } from './types';

export const COLOR_VALUES: Record<AnyColor, string> = {
  red: '#E53935',
  blue: '#1E88E5',
  yellow: '#FDD835',
  orange: '#FB8C00',
  green: '#43A047',
  purple: '#8E24AA',
};

export const RECIPES: ColorRecipe[] = [
  { inputs: ['red', 'yellow'], result: 'orange' },
  { inputs: ['blue', 'yellow'], result: 'green' },
  { inputs: ['red', 'blue'], result: 'purple' },
];

export const GAME_BG = '#F5F5F5';
