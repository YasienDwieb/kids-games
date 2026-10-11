import { Text, type TextStyle } from 'react-native';
import { COLORS, OUTLINE } from '../../constants';

type StarProps = {
  size?: number;
  filled?: boolean;
  style?: TextStyle;
};

// Gold star glyph with an ink edge — filled vs empty controlled by colour so the
// shape stays put.
export function Star({ size = 20, filled = true, style }: StarProps) {
  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size * 1.15,
          color: filled ? COLORS.gold : 'rgba(27,27,47,0.14)',
          textShadowColor: filled ? OUTLINE.color : 'transparent',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 0.1,
        },
        style,
      ]}
    >
      ★
    </Text>
  );
}
