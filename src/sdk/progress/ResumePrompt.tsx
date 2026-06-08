import { StyleSheet, Text, View } from 'react-native';
// Import useTranslation from react-i18next directly (not via @/sdk): this is an
// SDK-internal module and importing the barrel back would create a cycle.
import { useTranslation } from 'react-i18next';
import { BigButton } from '@/components/common/BigButton';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '@/constants';

export type ResumePromptProps = {
  level: number;
  onContinue: () => void;
  onStartOver: () => void;
  /** Optional overrides; default to the localized core strings. */
  title?: string;
  continueLabel?: string;
  startOverLabel?: string;
};

export function ResumePrompt({
  level,
  onContinue,
  onStartOver,
  title,
  continueLabel,
  startOverLabel,
}: ResumePromptProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>{title ?? t('resume.welcomeBack')}</Text>
        <BigButton
          title={continueLabel ?? t('resume.continueLevel', { level })}
          onPress={onContinue}
          accent="green"
        />
        <BigButton
          title={startOverLabel ?? t('resume.startOver')}
          onPress={onStartOver}
          variant="ghost"
        />
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
