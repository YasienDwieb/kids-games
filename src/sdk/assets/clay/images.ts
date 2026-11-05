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
  // Match Up pair pictures
  '🦴': require('./png/1F9B4.png'),
  '🥕': require('./png/1F955.png'),
  '🐭': require('./png/1F42D.png'),
  '🧀': require('./png/1F9C0.png'),
  '🍯': require('./png/1F36F.png'),
  '🐵': require('./png/1F435.png'),
  '🎋': require('./png/1F38B.png'),
  '🐿': require('./png/1F43F.png'),
  '🌰': require('./png/1F330.png'),
  '👨‍🍳': require('./png/1F468-200D-1F373.png'),
  '🍳': require('./png/1F373.png'),
  '👮': require('./png/1F46E.png'),
  '🚓': require('./png/1F693.png'),
  '👨‍🚒': require('./png/1F468-200D-1F692.png'),
  '🚒': require('./png/1F692.png'),
  '👨‍⚕': require('./png/1F468-200D-2695.png'),
  '💉': require('./png/1F489.png'),
  '👨‍🌾': require('./png/1F468-200D-1F33E.png'),
  '🚜': require('./png/1F69C.png'),
  '👨‍🎨': require('./png/1F468-200D-1F3A8.png'),
  '🖌': require('./png/1F58C.png'),
  '👷': require('./png/1F477.png'),
  '🔨': require('./png/1F528.png'),
  '🧑‍🚀': require('./png/1F9D1-200D-1F680.png'),
  '🪺': require('./png/1FABA.png'),
  '🏡': require('./png/1F3E1.png'),
  '🛖': require('./png/1F6D6.png'),
  '🌊': require('./png/1F30A.png'),
  '🐝': require('./png/1F41D.png'),
  '🌻': require('./png/1F33B.png'),
  '🕷': require('./png/1F577.png'),
  '🕸': require('./png/1F578.png'),
  '🏔': require('./png/1F3D4.png'),
  '🐌': require('./png/1F40C.png'),
  '🐚': require('./png/1F41A.png'),
  '🍇': require('./png/1F347.png'),
  '🍐': require('./png/1F350.png'),
  '🫐': require('./png/1FAD0.png'),
  '🐤': require('./png/1F424.png'),
  '🐔': require('./png/1F414.png'),
  '🦋': require('./png/1F98B.png'),
  '🐛': require('./png/1F41B.png'),
  '🐮': require('./png/1F42E.png'),
  '🌸': require('./png/1F338.png'),
  '🍪': require('./png/1F36A.png'),
};

// Variants of the same thing share one picture.
CLAY_IMAGES['🐕'] = CLAY_IMAGES['🐶'];
CLAY_IMAGES['🐈'] = CLAY_IMAGES['🐱'];
CLAY_IMAGES['🐇'] = CLAY_IMAGES['🐰'];
CLAY_IMAGES['🐎'] = CLAY_IMAGES['🐴'];
CLAY_IMAGES['🐄'] = CLAY_IMAGES['🐮'];

/** The clay picture for an emoji, or undefined if it has none. */
export function getClayImage(emoji: string): ImageSourcePropType | undefined {
  return CLAY_IMAGES[emoji.replace(/️/g, '')];
}
