import { Image, StyleSheet, Text, type ImageStyle, type StyleProp, type TextStyle } from 'react-native';
import { getEmojiImage } from '../../sdk/assets/emoji/images';

type EmojiImageProps = {
  emoji: string;
  /** Rendered width/height (and font size for the text fallback). */
  size: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * Renders an emoji as its bundled OpenMoji image for consistent, themable art
 * across devices; falls back to the system-font glyph for any unmapped emoji.
 */
export function EmojiImage({ emoji, size, style }: EmojiImageProps) {
  const source = getEmojiImage(emoji);
  if (!source) {
    return <Text style={[{ fontSize: size } as TextStyle, style as StyleProp<TextStyle>]}>{emoji}</Text>;
  }
  return (
    <Image
      source={source}
      style={[styles.base, { width: size, height: size }, style]}
      resizeMode="contain"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'center' },
});
