// Animal Safari — static require map of animal images.
//
// The shared Noto emoji PNGs (Apache-2.0, see /CREDITS.md) for each animal's
// `emoji` in constants.ts, so the pictures match the glyphs used elsewhere in
// the app. A static `require(...)` map is the RN-idiomatic way to reference
// bundled images: the bundler resolves each path at build time to a numeric
// module handle that <Image source={...} /> consumes.
//
// Keyed by `Animal.id` (see constants.ts) — all 12 animals covered.

export const ANIMAL_IMAGES: Record<string, number> = {
  lion: require('@/sdk/assets/emoji/png/1F981.png'),
  elephant: require('@/sdk/assets/emoji/png/1F418.png'),
  cow: require('@/sdk/assets/emoji/png/1F404.png'),
  dog: require('@/sdk/assets/emoji/png/1F436.png'),
  cat: require('@/sdk/assets/emoji/png/1F431.png'),
  frog: require('@/sdk/assets/emoji/png/1F438.png'),
  horse: require('@/sdk/assets/emoji/png/1F40E.png'),
  sheep: require('@/sdk/assets/emoji/png/1F411.png'),
  rooster: require('@/sdk/assets/emoji/png/1F414.png'),
  duck: require('@/sdk/assets/emoji/png/1F986.png'),
  bird: require('@/sdk/assets/emoji/png/1F426.png'),
  bee: require('@/sdk/assets/emoji/png/1F41D.png'),
};
