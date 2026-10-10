import { type ComponentProps } from 'react';
import { I18nManager } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../constants';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

// Chunky line icons for chrome (back, pause, sound, settings). Directional
// arrows mirror under RTL: pass the LTR name, the reading direction picks.
const MIRRORED: Partial<Record<string, IconName>> = {
  'chevron-back': 'chevron-forward',
  'chevron-forward': 'chevron-back',
  'arrow-back': 'arrow-forward',
  'arrow-forward': 'arrow-back',
};

export function Icon({ name, size = 22, color = COLORS.ink }: IconProps) {
  // Read at render: I18nManager.isRTL is not settled when modules evaluate.
  const resolved = I18nManager.isRTL ? MIRRORED[name] ?? name : name;
  return <Ionicons name={resolved} size={size} color={color} />;
}
