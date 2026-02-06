export type PrimaryColor = 'red' | 'blue' | 'yellow';

export type MixedColor = 'orange' | 'green' | 'purple';

export type AnyColor = PrimaryColor | MixedColor;

export type ColorRecipe = {
  inputs: [PrimaryColor, PrimaryColor];
  result: MixedColor;
};
