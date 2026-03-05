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

export type ColorRecipe = {
  ingredients: [ColorId, ColorId] | [ColorId, ColorId, ColorId];
  result: ColorId;
};

export type DraggableColor = {
  id: string;
  colorId: ColorId;
  position: { x: number; y: number };
  isBeingDragged: boolean;
};

export type MixingZone = {
  position: { x: number; y: number };
  size: { width: number; height: number };
  colorsInZone: ColorId[];
  resultColor: ColorId | null;
  isMixing: boolean;
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

export interface ExtendedMixingZone {
  currentColor: DynamicColor | null;
  mixHistory: string[];
  colorsInZone: ColorId[];
  isMixing: boolean;
}

export interface ExtendedGameState extends GameState {
  savedColors: SavedColor[];
  extendedMixingZone: ExtendedMixingZone;
}

export type GameState = {
  mode: GameMode;
  unlockedColors: ColorId[];
  discoveredRecipes: ColorRecipe[];
  currentChallenge: Challenge | null;
  challengeProgress: number;
  mixingZone: MixingZone;
  palette: DraggableColor[];
};
