export type ColorId =
  | 'red'
  | 'yellow'
  | 'blue'
  | 'orange'
  | 'green'
  | 'purple'
  | 'brown'
  | 'white'
  | 'black'
  | 'pink'
  | 'lightBlue';

export type ColorData = {
  id: ColorId;
  name: string;
  hex: string;
  isPrimary: boolean;
  isUnlocked: boolean;
  discoveredAt?: Date;
};

export type Challenge = {
  id: string;
  targetColor: ColorId;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type GameMode = 'freeplay' | 'challenge';

export interface DynamicColor {
  hex: string;
  name?: string;
  rgb: { r: number; g: number; b: number };
}

export interface SavedColor extends DynamicColor {
  id: string;
  name: string;
  createdAt: number;
  recipe?: string[];
}
