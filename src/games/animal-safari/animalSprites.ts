// Animal Safari — each animal's clay sprite sheet: 12 frames (4 columns × 3
// rows, 320px each) of the 3D model turning a full circle, frame 0 facing the
// viewer. Rendered from assets/models/ by scripts/3d/safari_sprites (see its
// render.html); re-run that after changing a model. Keyed by `Animal.id`.

export const SPRITE_COLS = 4;
export const SPRITE_ROWS = 3;
export const SPRITE_FRAMES = SPRITE_COLS * SPRITE_ROWS;

export const ANIMAL_SPRITES: Record<string, number> = {
  lion: require('./assets/sprites/lion.webp'),
  elephant: require('./assets/sprites/elephant.webp'),
  cow: require('./assets/sprites/cow.webp'),
  dog: require('./assets/sprites/dog.webp'),
  cat: require('./assets/sprites/cat.webp'),
  frog: require('./assets/sprites/frog.webp'),
  horse: require('./assets/sprites/horse.webp'),
  sheep: require('./assets/sprites/sheep.webp'),
  rooster: require('./assets/sprites/rooster.webp'),
  duck: require('./assets/sprites/duck.webp'),
  bird: require('./assets/sprites/bird.webp'),
  bee: require('./assets/sprites/bee.webp'),
};
