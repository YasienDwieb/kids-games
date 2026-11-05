import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { getClayImage } from '../../sdk/assets/clay/images';
import { EmojiImage } from './EmojiImage';

type ClayEmojiProps = {
  emoji: string;
  /** Rendered width/height. */
  size: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * An emoji drawn as its 3D clay-toy picture (see src/sdk/assets/clay/), in the
 * same style as the game covers and 3D models. Emoji without clay art fall
 * back to the Noto <EmojiImage>.
 */
export function ClayEmoji({ emoji, size, style }: ClayEmojiProps) {
  const source = getClayImage(emoji);
  if (!source) return <EmojiImage emoji={emoji} size={size} style={style} />;
  // Clay art fills its square edge to edge; a touch larger matches the
  // emoji's visual weight (Noto art has padding).
  const s = size * 1.1;
  return (
    <Image
      source={source}
      style={[{ width: s, height: s, alignSelf: 'center' }, style]}
      resizeMode="contain"
      accessible={false}
    />
  );
}
