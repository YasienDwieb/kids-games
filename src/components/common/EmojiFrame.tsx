import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, OUTLINE } from '../../constants';

type EmojiFrameProps = {
  emoji: string;
  size?: number;
  fontSize?: number;
  tint?: string;
  radius?: number;
  /** Ink outline around the frame (Pop Quest tiles). */
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Consistent tinted rounded frame around an emoji. Mirrors `.emoji-frame`.
export function EmojiFrame({
  emoji,
  size = 48,
  fontSize,
  tint = COLORS.surface2,
  radius = BORDER_RADIUS.card,
  outlined = false,
  style,
}: EmojiFrameProps) {
  return (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: radius, backgroundColor: tint },
        outlined && styles.outlined,
        style,
      ]}
    >
      <Text style={{ fontSize: fontSize ?? size * 0.52 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: { borderWidth: OUTLINE.thin, borderColor: OUTLINE.color },
});
