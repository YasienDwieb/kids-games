import { StyleSheet, Text, View } from 'react-native';
import { useSound, useGameShell, COLORS, FONT_SIZES } from '@/sdk';

export default function TemplateGame() {
  const { play } = useSound();
  const shell = useGameShell();

  return (
    <View style={styles.container}>
      <Text style={styles.text} onPress={() => play('pop')}>
        Tap me — replace this with your game.
      </Text>
      <Text
        style={styles.hint}
        onPress={() => shell.showOverlay('win', <Text style={styles.win}>You win! 🎉</Text>)}
      >
        Show win overlay
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: FONT_SIZES.lg, color: COLORS.text.primary },
  hint: { fontSize: FONT_SIZES.md, color: COLORS.text.secondary, marginTop: 16 },
  win: { fontSize: FONT_SIZES.xl, color: COLORS.text.inverse },
});
