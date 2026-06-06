import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants';
import { IconButton } from './IconButton';

type AppBarProps = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  left?: ReactNode;
};

// Unified header: back · centered title · action slot. Mirrors design AppBar.
export function AppBar({ title, onBack, right, left }: AppBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {left !== undefined ? (
          left
        ) : onBack ? (
          <IconButton glyph="‹" glyphSize={32} onPress={onBack} accessibilityLabel="Back" />
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  side: {
    width: 48,
    height: 48,
    justifyContent: 'center',
  },
  right: { alignItems: 'flex-end' },
  title: {
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
