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
  '🍊': require('./png/1F34A.png'),
  '🍌': require('./png/1F34C.png'),
  '⚽': require('./png/26BD.png'),
  '🌹': require('./png/1F339.png'),
  '🦆': require('./png/1F986.png'),
  '🐸': require('./png/1F438.png'),
  '🍋': require('./png/1F34B.png'),
  // Letter Land word pictures
  '🐶': require('./png/1F436.png'),
  '🥚': require('./png/1F95A.png'),
  '🐐': require('./png/1F410.png'),
  '🎩': require('./png/1F3A9.png'),
  '🍦': require('./png/1F366.png'),
  '🧃': require('./png/1F9C3.png'),
  '🪁': require('./png/1FA81.png'),
  '🦁': require('./png/1F981.png'),
  '🌙': require('./png/1F319.png'),
  '👃': require('./png/1F443.png'),
  '🐼': require('./png/1F43C.png'),
  '👑': require('./png/1F451.png'),
  '🐰': require('./png/1F430.png'),
  '☀': require('./png/2600.png'),
  '🌳': require('./png/1F333.png'),
  '🌂': require('./png/1F302.png'),
  '🚐': require('./png/1F690.png'),
  '🐋': require('./png/1F40B.png'),
  '🎹': require('./png/1F3B9.png'),
  '🧶': require('./png/1F9F6.png'),
  '🦓': require('./png/1F993.png'),
  '🦊': require('./png/1F98A.png'),
  '🐪': require('./png/1F42A.png'),
  '🐴': require('./png/1F434.png'),
  '🐑': require('./png/1F411.png'),
  '🐻': require('./png/1F43B.png'),
  '🪰': require('./png/1FAB0.png'),
  '🪶': require('./png/1FAB6.png'),
  '🦒': require('./png/1F992.png'),
  '🚀': require('./png/1F680.png'),
  '✈': require('./png/2708.png'),
  '✉': require('./png/2709.png'),
  '🐦': require('./png/1F426.png'),
  '🦌': require('./png/1F98C.png'),
  '🐘': require('./png/1F418.png'),
  '📱': require('./png/1F4F1.png'),
  '✋': require('./png/270B.png'),
};

/** The clay picture for an emoji, or undefined if it has none. */
export function getClayImage(emoji: string): ImageSourcePropType | undefined {
  return CLAY_IMAGES[emoji.replace(/️/g, '')];
}
