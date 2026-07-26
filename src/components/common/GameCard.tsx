import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ACCENTS, COLORS, FONTS, SHADOWS, BORDER_RADIUS, type AccentName } from '../../constants';
import { EmojiFrame } from './EmojiFrame';
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
  // frame flexes to absorb leftover height so cards stay a uniform size.
  fill?: boolean;
  emojiSize?: number;
  /** Full game name for screen readers when `name` is an abbreviated tile label. */
  accessibilityLabel?: string;
};

// Game tile for the home grid. Mirrors GameTile in design/home.jsx.
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.card,
        fill && styles.cardFill,
        SHADOWS.md,
        pressed && styles.pressed,
        style,
      ]}
    >
      {tag ? (
        <View style={[styles.tag, { backgroundColor: a.base }]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ) : null}

      <EmojiFrame
        emoji={icon}
        tint={a.tint}
        style={[styles.emoji, fill && styles.emojiFill]}
        fontSize={emojiSize ?? 52}
      />

      <View style={styles.meta}>
        {/* One line in the landscape rail: two wrapped lines ate 33% of the tile
            height, and the emoji frame (flex: 1) reclaims every point the label
            gives back. The portrait grid keeps two lines, where there is room. */}
        <Text
          style={[styles.name, fill && styles.nameFill]}
          numberOfLines={fill ? 1 : 2}
        >
          {name}
        </Text>
        {progress > 0 ? (
          <View style={styles.row}>
            <View style={styles.progress}>
              <Star size={13} />
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.tile,
    padding: 16,
    gap: 12,
  },
  cardFill: {
    height: '100%',
    padding: 12,
    gap: 8,
  },
  pressed: { transform: [{ scale: 0.97 }] },
  tag: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: BORDER_RADIUS.pill,
  },
  tagText: {
    fontFamily: FONTS.display,
    fontSize: 11,
    letterSpacing: 0.4,
    color: COLORS.surface,
  },
  emoji: {
    width: '100%',
    aspectRatio: 1.35,
    height: undefined,
  },
  // Fill mode: drop the fixed aspect so the frame flexes to fill leftover height.
  emojiFill: {
    aspectRatio: undefined,
    height: undefined,
    flex: 1,
    minHeight: 44,
  },
  meta: { gap: 8, paddingHorizontal: 4 },
  name: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
    lineHeight: 21,
  },
  // Rail tiles are ~116dp wide, so the label has to come down a step to hold a
  // full name on one line. Still well above the 12dp caption floor.
  nameFill: {
    fontSize: 14,
    lineHeight: 17,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  progressText: {
    fontFamily: FONTS.display,
    fontSize: 12,
    color: COLORS.inkSoft,
  },
});
