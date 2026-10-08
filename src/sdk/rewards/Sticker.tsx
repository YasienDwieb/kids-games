import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { EmojiImage } from '@/components/common';
import { COLORS } from '@/constants/colors';
import { SHADOWS } from '@/constants/dimensions';
import { FONTS } from '@/constants/typography';
import { stickerEmoji } from './stickers';

type StickerProps = {
  id: string;
  size?: number;
  locked?: boolean;
  /** Small playful tilt (deg) so a page of stickers looks hand-placed. */
  tilt?: number;
  style?: ViewStyle;
};

/** A die-cut sticker: the glyph on a thick white rounded backing with a soft shadow. */
export function Sticker({ id, size = 72, locked = false, tilt = 0, style }: StickerProps) {
  const emoji = stickerEmoji(id) ?? '⭐';
  const radius = size * 0.3;
  if (locked) {
    return (
      <View
        style={[
          styles.locked,
          { width: size, height: size, borderRadius: radius },
          style,
        ]}
      >
        <Text style={[styles.question, { fontSize: size * 0.42 }]}>?</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.backing,
        SHADOWS.sm,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: Math.max(3, size * 0.06),
          transform: [{ rotate: `${tilt}deg` }],
        },
        style,
      ]}
    >
      <EmojiImage emoji={emoji} size={size * 0.62} />
    </View>
  );
}

const styles = StyleSheet.create({
  backing: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: {
    backgroundColor: COLORS.canvas2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: { fontFamily: FONTS.displayBold, color: COLORS.inkFaint },
});
