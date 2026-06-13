import { StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  PressableButton,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import type { PauseOverlayProps } from '../types';

// Pause overlay — scrim + a small card with resume/exit. Purely
// presentational; the race world is frozen by the engine while it shows.
export function PauseOverlay({ onResume, onExit }: PauseOverlayProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.scrim} onStartShouldSetResponder={() => true}>
      <View style={styles.card}>
        <Text style={styles.glyph}>⏸️</Text>
        <Text style={styles.title}>{t('turbo-road:pause.title')}</Text>
        <View style={styles.buttons}>
          <PressableButton
            label={t('turbo-road:pause.resume')}
            accent="coral"
            onPress={onResume}
          />
          <PressableButton
            label={t('turbo-road:pause.exit')}
            variant="ghost"
            onPress={onExit}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  glyph: { fontSize: 56, lineHeight: 64 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.ink,
  },
  buttons: { alignSelf: 'stretch', gap: SPACING.sm + SPACING.xs, marginTop: SPACING.sm },
});
