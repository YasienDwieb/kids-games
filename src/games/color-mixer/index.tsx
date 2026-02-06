import { StyleSheet, Text, View } from 'react-native';
import { GAME_BG } from './constants';

export default function ColorMixerGame() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎨 Color Mixer</Text>
      <Text style={styles.subtitle}>Mix colors and discover new ones!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});
