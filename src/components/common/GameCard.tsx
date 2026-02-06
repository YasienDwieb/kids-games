import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants';

type GameCardProps = {
  icon: string;
  name: string;
  color?: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function GameCard({
  icon,
  name,
  color = COLORS.primary.blue,
  onPress,
  style,
}: GameCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 120,
    minHeight: 120,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.text.inverse,
    textAlign: 'center',
  },
});
