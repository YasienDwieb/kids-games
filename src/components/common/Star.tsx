import { Text, type TextStyle } from 'react-native';
import { COLORS } from '../../constants';

type StarProps = {
  size?: number;
  filled?: boolean;
  style?: TextStyle;
};

// Gold star glyph — filled vs faint controlled by color so the shape stays put.
export function Star({ size = 20, filled = true, style }: StarProps) {
  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size * 1.1,
          color: filled ? COLORS.gold : 'rgba(59,48,38,0.13)',
        },
        style,
      ]}
    >
      ★
    </Text>
  );
}
