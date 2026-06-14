import { StyleSheet, Text, View } from 'react-native';
import { useGameShell, useTranslation, COLORS, FONTS, FONT_SIZES, SPACING } from '@/sdk';

export default function CountAndPopGame() {
  const shell = useGameShell();
  // Every visible string goes through t() — see SKILL.md §7.
  const { t } = useTranslation();

  void shell; // placeholder — shell will be used for score/overlays in sprint 1+

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('count-and-pop:placeholder')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  text: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
});
