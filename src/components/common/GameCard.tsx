import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  ACCENTS,
  COLORS,
  FONTS,
  OUTLINE,
  POP,
  SHADOWS,
  BORDER_RADIUS,
  bestTextOn,
  type AccentName,
} from '../../constants';
import { EmojiImage } from './EmojiImage';
import { Star } from './Star';

type GameCardProps = {
  icon: string;
  name: string;
  accent?: AccentName;
  tag?: string; // e.g. "NEW"
  progress?: number; // 0..1, shown as a percent when > 0
  onPress: () => void;
  style?: ViewStyle;
  // Fill mode: stretch to fill a fixed-size cell (landscape rail) — the emoji
  // window flexes to absorb leftover height so cards stay a uniform size.
  fill?: boolean;
  emojiSize?: number;
  /** Full game name for screen readers when `name` is an abbreviated tile label. */
  accessibilityLabel?: string;
};

// Home tile: the game's own loud colour, an ink outline and hard shadow, the
// icon in a white window and the name in the display face underneath.
export function GameCard({
  icon,
  name,
  accent = 'blue',
  tag,
  progress = 0,
  onPress,
  style,
  fill = false,
  emojiSize,
  accessibilityLabel,
}: GameCardProps) {
  const a = ACCENTS[accent];
  const label = bestTextOn(a.base);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: a.base },
        fill && styles.cardFill,
        pressed ? styles.pressed : SHADOWS.sm,
        style,
      ]}
    >
      <View style={[styles.window, fill && styles.windowFill]}>
        <EmojiImage emoji={icon} size={emojiSize ?? 52} />
      </View>

      <View style={styles.meta}>
        <Text
          style={[styles.name, fill && styles.nameFill, { color: label }]}
          numberOfLines={fill ? 1 : 2}
          adjustsFontSizeToFit={fill}
          minimumFontScale={0.75}
        >
          {name}
        </Text>
        {progress > 0 ? (
          <View style={styles.progress}>
            <Star size={13} />
            <Text style={[styles.progressText, { color: label }]}>{Math.round(progress * 100)}%</Text>
          </View>
        ) : null}
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
  },
  // Fill mode: drop the fixed aspect so the window flexes to fill leftover height.
  windowFill: { aspectRatio: undefined, flex: 1, minHeight: 44 },
  meta: { gap: 4, paddingHorizontal: 2 },
  name: {
    fontFamily: FONTS.display,
    fontSize: 19,
    lineHeight: 23,
    textAlign: 'center',
  },
  // Rail tiles are ~116dp wide, so the label comes down a step to hold a full
  // short name on one line. Still well above the 12dp caption floor.
  nameFill: { fontSize: 16, lineHeight: 20 },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  progressText: { fontFamily: FONTS.display, fontSize: 12 },
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
