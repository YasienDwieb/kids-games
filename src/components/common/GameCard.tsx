import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  ACCENTS,
  COLORS,
  FONTS,
  OUTLINE,
  POP,
  SHADOWS,
  BORDER_RADIUS,
  type AccentName,
} from '../../constants';
import { EmojiImage } from './EmojiImage';

type GameCardProps = {
  icon: string;
  /** Illustrated art filling the window; falls back to the `icon` emoji. */
  cover?: number;
  /** Screen-reader name; tiles show no text, the picture is the title. */
  name: string;
  accent?: AccentName;
  tag?: string; // e.g. "NEW"
  onPress: () => void;
  style?: ViewStyle;
  // Fill mode: stretch to fill a fixed-size cell (landscape rail) — the emoji
  // window flexes to absorb leftover height so cards stay a uniform size.
  fill?: boolean;
  emojiSize?: number;
};

// Home tile: the game's own loud colour, an ink outline and hard shadow, the
// art in a white window. No title: children know a game by its picture.
export function GameCard({
  icon,
  cover,
  name,
  accent = 'blue',
  tag,
  onPress,
  style,
  fill = false,
  emojiSize,
}: GameCardProps) {
  const a = ACCENTS[accent];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: a.base },
        fill && styles.cardFill,
        pressed ? styles.pressed : SHADOWS.sm,
        style,
      ]}
    >
      <View style={[styles.window, fill && styles.windowFill]}>
        {cover != null ? (
          <Image source={cover} style={styles.cover} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          <EmojiImage emoji={icon} size={emojiSize ?? 52} />
        )}
      </View>

      {tag ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.tile,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    padding: 12,
    gap: 8,
  },
  cardFill: {
    height: '100%',
    padding: 9,
    gap: 6,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  window: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: BORDER_RADIUS.card - 4,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cover: { width: '100%', height: '100%' },
  // Fill mode: drop the fixed aspect so the window flexes to fill leftover height.
  windowFill: { aspectRatio: undefined, flex: 1, minHeight: 44 },
  tag: {
    position: 'absolute',
    top: -10,
    end: -6,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
    transform: [{ rotate: '6deg' }],
  },
  tagText: { fontFamily: FONTS.display, fontSize: 13, color: COLORS.ink },
});
