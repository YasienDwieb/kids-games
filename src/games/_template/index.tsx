import { StyleSheet, Text, View } from 'react-native';
import { useRoundEnd, useSound, useTranslation, COLORS, FONT_SIZES } from '@/sdk';

export default function TemplateGame() {
  const { play } = useSound();
  const roundEnd = useRoundEnd();
  // Every visible string goes through t() — see SKILL.md §7.
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.text} onPress={() => play('pop')}>
        {t('template-game:tapMe')}
      </Text>
      <Text
        style={styles.hint}
        // Win: celebrate, wait for the praise, then start the next round. No Next button.
        onPress={() => {
          play('win');
          void roundEnd.next('big', () => undefined);
        }}
      >
        {t('template-game:showWin')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: FONT_SIZES.lg, color: COLORS.text.primary },
  hint: { fontSize: FONT_SIZES.md, color: COLORS.text.secondary, marginTop: 16 },
});
