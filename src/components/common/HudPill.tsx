import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { COLORS, FONTS, OUTLINE, SHADOWS, BORDER_RADIUS } from '../../constants';

type HudPillProps = {
  children: ReactNode;
  style?: ViewStyle;
};

// Ink-outlined pill for in-game counters (stars / moves / mission).
export function HudPill({ children, style }: HudPillProps) {
  return <View style={[styles.pill, SHADOWS.sm, style]}>{children}</View>;
}

export const hudTextStyle = {
  fontFamily: FONTS.display,
  fontSize: 18,
  color: COLORS.ink,
} as const;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
});
