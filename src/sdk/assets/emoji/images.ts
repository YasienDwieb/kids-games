/**
 * Emoji → image map (Google Noto Emoji, Apache-2.0 / OFL — see /CREDITS.md).
 *
 * The asset-abstraction layer for emoji art: games reference a glyph (the stable
 * logical key) and resolve it to a bundled PNG here, instead of relying on the
 * device's system emoji font (which varies per phone and can't be themed).
 * Parallels the audio manifest. Keys are the literal emoji from game content
 * (with the U+FE0F variation selector stripped — getEmojiImage normalizes lookups
 * the same way, so '⭐' and '⭐️' resolve identically). Filenames use the glyph's
 * codepoints (uppercase hex, hyphen-joined, FE0F stripped).
 *
 * To add glyphs: drop the 128px PNG in ./png/<CODE>.png and add a line here.
 * Unknown glyphs fall back to the system font via <EmojiImage>.
 */
import type { ImageSourcePropType } from "react-native";

export const EMOJI_IMAGES: Record<string, ImageSourcePropType> = {
  "🌰": require("./png/1F330.png"),
  "🌻": require("./png/1F33B.png"),
  "🍄": require("./png/1F344.png"),
  "🍇": require("./png/1F347.png"),
  "🍊": require("./png/1F34A.png"),
  "🍌": require("./png/1F34C.png"),
  "🍎": require("./png/1F34E.png"),
  "🍐": require("./png/1F350.png"),
  "🍓": require("./png/1F353.png"),
  "🍯": require("./png/1F36F.png"),
  "🍳": require("./png/1F373.png"),
  "🎈": require("./png/1F388.png"),
  "🎋": require("./png/1F38B.png"),
  "🏔": require("./png/1F3D4.png"),
  "🏠": require("./png/1F3E0.png"),
  "🐄": require("./png/1F404.png"),
  "🐇": require("./png/1F407.png"),
  "🐈": require("./png/1F408.png"),
  "🐌": require("./png/1F40C.png"),
  "🐎": require("./png/1F40E.png"),
  "🐔": require("./png/1F414.png"),
  "🐕": require("./png/1F415.png"),
  "🐚": require("./png/1F41A.png"),
  "🐛": require("./png/1F41B.png"),
  "🐝": require("./png/1F41D.png"),
  "🐞": require("./png/1F41E.png"),
  "🐟": require("./png/1F41F.png"),
  "🐤": require("./png/1F424.png"),
  "🐦": require("./png/1F426.png"),
  "🐧": require("./png/1F427.png"),
  "🐭": require("./png/1F42D.png"),
  "🐮": require("./png/1F42E.png"),
  "🐰": require("./png/1F430.png"),
  "🐱": require("./png/1F431.png"),
  "🐴": require("./png/1F434.png"),
  "🐵": require("./png/1F435.png"),
  "🐶": require("./png/1F436.png"),
  "🐸": require("./png/1F438.png"),
  "🐻": require("./png/1F43B.png"),
  "🐼": require("./png/1F43C.png"),
  "🐿": require("./png/1F43F.png"),
  "👨‍🌾": require("./png/1F468-200D-1F33E.png"),
  "👨‍🍳": require("./png/1F468-200D-1F373.png"),
  "👨‍🎨": require("./png/1F468-200D-1F3A8.png"),
  "👨‍🚒": require("./png/1F468-200D-1F692.png"),
  "👨‍⚕": require("./png/1F468-200D-2695.png"),
  "👮": require("./png/1F46E.png"),
  "👷": require("./png/1F477.png"),
  "💉": require("./png/1F489.png"),
  "🔨": require("./png/1F528.png"),
  "🕷": require("./png/1F577.png"),
  "🕸": require("./png/1F578.png"),
  "🖌": require("./png/1F58C.png"),
  "🚀": require("./png/1F680.png"),
  "🚒": require("./png/1F692.png"),
  "🚓": require("./png/1F693.png"),
  "🚗": require("./png/1F697.png"),
  "🚜": require("./png/1F69C.png"),
  "🛖": require("./png/1F6D6.png"),
  "🥕": require("./png/1F955.png"),
  "🦁": require("./png/1F981.png"),
  "🦄": require("./png/1F984.png"),
  "🦊": require("./png/1F98A.png"),
  "🦋": require("./png/1F98B.png"),
  "🦴": require("./png/1F9B4.png"),
  "🧀": require("./png/1F9C0.png"),
  "🧑‍🚀": require("./png/1F9D1-200D-1F680.png"),
  "🪺": require("./png/1FABA.png"),
  "🫐": require("./png/1FAD0.png"),
  "⭐": require("./png/2B50.png"),
};

/** Resolve an emoji glyph to its bundled image, or undefined if not available. */
export function getEmojiImage(emoji: string): ImageSourcePropType | undefined {
  const key = emoji.indexOf("\uFE0F") === -1 ? emoji : emoji.replace(/\uFE0F/g, "");
  return EMOJI_IMAGES[key];
}
