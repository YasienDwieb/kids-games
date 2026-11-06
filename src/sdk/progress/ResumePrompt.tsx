import { StyleSheet, View } from 'react-native';
// Import useTranslation from react-i18next directly (not via @/sdk): this is an
// SDK-internal module and importing the barrel back would create a cycle.
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/Icon';
import { PressableButton } from '@/components/common/PressableButton';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, OUTLINE } from '@/constants';

export type ResumePromptProps = {
  level: number;
  onContinue: () => void;
  onStartOver: () => void;
};

// Keep going or start over, as two pictures a pre-reader can tell apart.
export function ResumePrompt({ level, onContinue, onStartOver }: ResumePromptProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <PressableButton
          accessibilityLabel={t('resume.startOver')}
          variant="ghost"
          onPress={onStartOver}
          style={styles.button}
        >
          <Icon name="refresh" size={36} />
        </PressableButton>
        <PressableButton
          accessibilityLabel={t('resume.continueLevel', { level })}
          accent="green"
          onPress={onContinue}
          style={styles.button}
        >
          <Icon name="play" size={48} />
        </PressableButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.tile,
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    ...SHADOWS.lg,
  },
  button: { minWidth: 120 },
});
