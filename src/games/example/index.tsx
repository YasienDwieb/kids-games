import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants';

export default function ExampleGame() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌈</Text>
      <Text style={styles.title}>Example Game</Text>
      <Text style={styles.subtitle}>
        If you can see this, the game loaded!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  emoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text.inverse,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.inverse,
    textAlign: 'center',
    marginTop: SPACING.md,
    opacity: 0.9,
  },
});
