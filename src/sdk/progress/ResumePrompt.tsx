import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/common/BigButton';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';

export type ResumePromptProps = {
  level: number;
  onContinue: () => void;
  onStartOver: () => void;
  title?: string;
  continueLabel?: string;
  startOverLabel?: string;
};

export function ResumePrompt({
  level,
  onContinue,
  onStartOver,
  title = 'Welcome back! 👋',
  continueLabel,
  startOverLabel = 'Start over',
}: ResumePromptProps) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <BigButton
          title={continueLabel ?? `Continue · Level ${level}`}
          onPress={onContinue}
          color={COLORS.primary.green}
        />
        <BigButton title={startOverLabel} onPress={onStartOver} color={COLORS.primary.blue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'stretch',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 24,
    backgroundColor: COLORS.background.white,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});
