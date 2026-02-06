import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants';

type SafeContainerProps = {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
};

export function SafeContainer({
  children,
  backgroundColor = COLORS.background.light,
  style,
}: SafeContainerProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
});
