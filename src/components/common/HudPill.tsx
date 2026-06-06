import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS } from '../../constants';

type HudPillProps = {
  children: ReactNode;
  style?: ViewStyle;
};

// Surface pill for in-game counters (stars / moves). Mirrors design HudPill.
export function HudPill({ children, style }: HudPillProps) {
  return <View style={[styles.pill, SHADOWS.sm, style]}>{children}</View>;
}

export const hudTextStyle = {
  fontFamily: FONTS.display,
  fontSize: 17,
  color: COLORS.ink,
} as const;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
});
