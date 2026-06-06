import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../../constants';

type EmojiFrameProps = {
  emoji: string;
  size?: number;
  fontSize?: number;
  tint?: string;
  radius?: number;
  style?: ViewStyle;
};

// Consistent tinted rounded frame around an emoji. Mirrors `.emoji-frame`.
export function EmojiFrame({
  emoji,
  size = 48,
  fontSize,
  tint = COLORS.surface2,
  radius = BORDER_RADIUS.card,
  style,
}: EmojiFrameProps) {
  return (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: radius, backgroundColor: tint },
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
});
