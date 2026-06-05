import { type ViewStyle } from 'react-native';
import { PressableButton } from './PressableButton';
import type { AccentName } from '../../constants';

type BigButtonProps = {
  title: string;
  onPress: () => void;
  accent?: AccentName;
  color?: string;
  variant?: 'solid' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
};

// Thin wrapper over the chunky PressableButton, preserving the original
// title/onPress/color API used across games.
export function BigButton({
  title,
  onPress,
  accent,
  color,
  variant,
  disabled,
  style,
}: BigButtonProps) {
  return (
    <PressableButton
      label={title}
      onPress={onPress}
      accent={accent}
      color={color}
      variant={variant}
      disabled={disabled}
      style={style}
    />
  );
}
