import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/common/BigButton';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '@/constants';

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
          accent="green"
        />
        <BigButton title={startOverLabel} onPress={onStartOver} variant="ghost" />
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
    borderRadius: BORDER_RADIUS.tile,
    backgroundColor: COLORS.surface,
    ...SHADOWS.lg,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});
