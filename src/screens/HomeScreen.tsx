import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Games</Text>
      <Text style={styles.placeholder}>Games will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  placeholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
});
