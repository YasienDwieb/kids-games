// Animal Safari — static require map of OpenMoji animal images.
//
// Local PNG assets (CC BY-SA 4.0, OpenMoji) keyed by animal id. A static
// `require(...)` map is the RN-idiomatic way to reference bundled images: the
// bundler resolves each path at build time to a numeric module handle that
// <Image source={...} /> consumes. png is in Metro's default assetExts and is
// transformed by jest-expo, so no metro/jest change is needed.
//
// Keyed by `Animal.id` (see constants.ts) — all 12 animals covered.

export const ANIMAL_IMAGES: Record<string, number> = {
  lion: require('@/sdk/assets/images/animals/lion.png'),
  elephant: require('@/sdk/assets/images/animals/elephant.png'),
  cow: require('@/sdk/assets/images/animals/cow.png'),
  dog: require('@/sdk/assets/images/animals/dog.png'),
  cat: require('@/sdk/assets/images/animals/cat.png'),
  frog: require('@/sdk/assets/images/animals/frog.png'),
  horse: require('@/sdk/assets/images/animals/horse.png'),
  sheep: require('@/sdk/assets/images/animals/sheep.png'),
  rooster: require('@/sdk/assets/images/animals/rooster.png'),
  duck: require('@/sdk/assets/images/animals/duck.png'),
  bird: require('@/sdk/assets/images/animals/bird.png'),
  bee: require('@/sdk/assets/images/animals/bee.png'),
};
