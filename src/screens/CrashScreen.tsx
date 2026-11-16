import { StyleSheet, View } from 'react-native';
import { useTranslation } from '@/sdk';
import { Icon, IconButton } from '../components/common';
import { COLORS, POP } from '../constants';

/**
 * Shown by the app-wide error boundary instead of closing the app: one big
 * home button that rebuilds the navigator from Home. Deliberately plain (no
 * buddy, no stores) so it can't fail the same way.
 */
export function CrashScreen({ onHome }: { onHome: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <IconButton onPress={onHome} accessibilityLabel={t('break.home')} size={112} color={POP.zap}>
        <Icon name="home" size={56} />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.canvas },
});
