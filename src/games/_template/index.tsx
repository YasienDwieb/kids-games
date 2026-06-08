import { StyleSheet, Text, View } from 'react-native';
import { useSound, useGameShell, useTranslation, COLORS, FONT_SIZES } from '@/sdk';

export default function TemplateGame() {
  const { play } = useSound();
  const shell = useGameShell();
  // Every visible string goes through t() — see SKILL.md §7.
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.text} onPress={() => play('pop')}>
        {t('template-game:tapMe')}
      </Text>
      <Text
        style={styles.hint}
        onPress={() =>
          shell.showOverlay('win', <Text style={styles.win}>{t('template-game:win')}</Text>)
        }
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
  win: { fontSize: FONT_SIZES.xl, color: COLORS.text.inverse },
});
