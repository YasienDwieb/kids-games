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

/** The five pigments a child can actually drop into the pot. */
export type PigmentId = Extract<ColorId, 'red' | 'yellow' | 'blue' | 'white' | 'black'>;

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
  /** A famous colour to make; endless challenges have none and use `targetHex`. */
  targetColor?: ColorId;
  /** The exact colour to make (endless challenges), else the famous colour's hex. */
  targetHex?: string;
  /** One way to make it — shown as the hint (🔴 + 🟡), so no reading is needed. */
  recipe: PigmentId[];
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** A generated "mystery colour" from the endless pool. */
  endless?: boolean;
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
  /**
   * How to re-make this color. Swatch and pigment are deliberately separate concepts:
   * `hex` is what the child sees in My Colors and never changes, while `mixLog` is what
   * enters a mix. Saves made before the pigment engine have no log — they re-enter the
   * pot as a single best-fit drop set computed once at migration (`fit`), never
   * recomputed in a render path.
   */
  mixLog?: PigmentId[];
  fit?: PigmentId[];
}
