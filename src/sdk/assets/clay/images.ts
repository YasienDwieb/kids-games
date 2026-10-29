/**
 * Emoji → 3D clay-toy picture (Higgsfield, see /CREDITS.md), drawn by
 * <ClayEmoji>. The clay set matches the game covers and 3D models; any emoji
 * without clay art falls back to its Noto image. Keys are the literal emoji
 * (U+FE0F stripped, like the emoji map); files use the same codepoint names.
 *
 * To add one: generate the object on white with Higgsfield, remove the
 * background, trim to a 160×160 square PNG in ./png/<CODE>.png, add a line.
 */
import type { ImageSourcePropType } from 'react-native';

export const CLAY_IMAGES: Record<string, ImageSourcePropType> = {
  '🍎': require('./png/1F34E.png'),
  '⭐': require('./png/2B50.png'),
  '🎈': require('./png/1F388.png'),
  '🐞': require('./png/1F41E.png'),
  '🍓': require('./png/1F353.png'),
  '🚗': require('./png/1F697.png'),
  '🐟': require('./png/1F41F.png'),
  '🐱': require('./png/1F431.png'),
};

/** The clay picture for an emoji, or undefined if it has none. */
export function getClayImage(emoji: string): ImageSourcePropType | undefined {
  return CLAY_IMAGES[emoji.replace(/️/g, '')];
}
