import { Image } from 'react-native';
import { EmojiImage } from '@/components/common/EmojiImage';
import { Fanoos } from './Fanoos';

/**
 * One piece of occasion art. Stand-ins today (`fanoos` is drawn, `emoji` is a
 * bundled Noto image); an illustrated set swaps in as `image` without touching
 * the components that place them.
 */
export type OccasionArt =
  | { kind: 'fanoos' }
  | { kind: 'emoji'; emoji: string }
  | { kind: 'image'; source: number; aspect?: number };

/** Draws `art` `size` tall. */
export function ArtPiece({ art, size }: { art: OccasionArt; size: number }) {
  switch (art.kind) {
    case 'fanoos':
      return <Fanoos size={size} />;
    case 'image':
      return <Image source={art.source} style={{ width: size * (art.aspect ?? 1), height: size }} resizeMode="contain" />;
    default:
      return <EmojiImage emoji={art.emoji} size={size} />;
  }
}

/** Width of `art` drawn `size` tall (for laying pieces out). */
export function artWidth(art: OccasionArt, size: number): number {
  if (art.kind === 'fanoos') return size * 0.56;
  if (art.kind === 'image') return size * (art.aspect ?? 1);
  return size;
}
